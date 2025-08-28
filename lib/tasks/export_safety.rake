namespace :export do
  desc 'Check export safety and permissions'
  task safety_check: :environment do
    puts "\n✅ Starting Export Safety Check..."
    puts "=" * 50
    
    all_checks_passed = true
    
    # 1. Test read-only permissions
    print "Checking database permissions... "
    begin
      ActiveRecord::Base.connection.execute("DELETE FROM measurements WHERE id = -999999")
      puts "❌ DANGER: Delete permission exists!"
      all_checks_passed = false
    rescue => e
      puts "✅ No delete permission (expected)"
    end
    
    begin
      ActiveRecord::Base.connection.execute("UPDATE measurements SET co2ppm = 0 WHERE id = -999999")
      puts "❌ DANGER: Update permission exists!"
      all_checks_passed = false
    rescue => e
      puts "✅ No update permission (good)"
    end
    
    # 2. Check memory usage
    print "\nChecking memory usage... "
    memory_mb = `ps -o rss= -p #{Process.pid}`.to_i / 1024
    memory_limit = ENV['DYNO'].present? ? 512 : 2048
    
    if memory_mb < memory_limit * 0.8
      puts "✅ Memory usage: #{memory_mb}MB / #{memory_limit}MB (#{(memory_mb.to_f / memory_limit * 100).round(1)}%)"
    else
      puts "⚠️  Memory usage high: #{memory_mb}MB / #{memory_limit}MB"
      all_checks_passed = false
    end
    
    # 3. Test small export
    print "\nTesting CSV export (10 records)... "
    begin
      service = Export::CsvService.new
      output = StringIO.new
      count = 0
      
      Measurement.limit(10).find_each do |measurement|
        output.puts service.send(:build_csv_row, measurement, Export::BaseService::DEFAULT_FIELDS).join(',')
        count += 1
      end
      
      puts "✅ Test export successful: #{count} records"
    rescue => e
      puts "❌ Export failed: #{e.message}"
      all_checks_passed = false
    end
    
    # 4. Test JSONL export
    print "Testing JSONL export (10 records)... "
    begin
      service = Export::JsonlService.new
      output = StringIO.new
      count = 0
      
      Measurement.limit(10).find_each do |measurement|
        json_data = service.send(:build_json_record, measurement, nil)
        output.puts json_data.to_json
        count += 1
      end
      
      puts "✅ Test export successful: #{count} records"
    rescue => e
      puts "❌ Export failed: #{e.message}"
      all_checks_passed = false
    end
    
    # 5. Check for ExportToken
    print "\nChecking for export tokens... "
    token_count = ExportToken.active.count
    if token_count > 0
      puts "✅ Found #{token_count} active export token(s)"
    else
      puts "⚠️  No active export tokens found"
      puts "   Create one with: rails console"
      puts "   ExportToken.create!(description: 'Test', expires_at: 1.year.from_now)"
    end
    
    # 6. Check cache configuration
    print "\nChecking Rails cache... "
    begin
      test_key = "export_safety_test_#{Time.current.to_i}"
      Rails.cache.write(test_key, 'test', expires_in: 1.second)
      value = Rails.cache.read(test_key)
      Rails.cache.delete(test_key)
      
      if value == 'test'
        puts "✅ Cache is working"
      else
        puts "⚠️  Cache may not be configured properly"
      end
    rescue => e
      puts "❌ Cache error: #{e.message}"
      all_checks_passed = false
    end
    
    # 7. Check measurement data
    print "\nChecking measurement data... "
    total_count = Measurement.count
    recent_count = Measurement.where('created_at > ?', 30.days.ago).count
    high_co2_count = Measurement.where('co2ppm > ?', 1000).count
    
    puts "✅ Total: #{total_count} | Recent: #{recent_count} | High CO2: #{high_co2_count}"
    
    if total_count == 0
      puts "   ⚠️  No measurements found in database"
    end
    
    # Final summary
    puts "\n" + "=" * 50
    if all_checks_passed
      puts "✅ ALL SAFETY CHECKS PASSED - Ready for export!"
    else
      puts "⚠️  Some checks failed - Review before deploying"
    end
    puts "=" * 50
  end
  
  desc 'Generate test export token for development'
  task generate_token: :environment do
    token = ExportToken.create!(
      description: "Development Test Token - #{Time.current}",
      expires_at: 1.month.from_now,
      permissions: {
        formats: ['csv', 'jsonl', 'json'],
        max_records: 10000,
        rate_limit_per_hour: 100
      }
    )
    
    puts "\n✅ Export token created successfully!"
    puts "=" * 60
    puts "Token: #{token.token}"
    puts "Expires: #{token.expires_at}"
    puts "Formats: #{token.permissions['formats'].join(', ')}"
    puts "Max Records: #{token.permissions['max_records']}"
    puts "Rate Limit: #{token.permissions['rate_limit_per_hour']} requests/hour"
    puts "=" * 60
    puts "\nExample usage:"
    puts "curl -H 'Authorization: Bearer #{token.token}' \\"
    puts "     'http://localhost:3000/api/v1/export?format_type=csv'"
  end
end