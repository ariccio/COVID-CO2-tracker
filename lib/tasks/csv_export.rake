# frozen_string_literal: true

namespace :export do
  desc 'Export CO2 measurement data to CSV file'
  task measurements_to_csv: :environment do
    puts '========================================='
    puts 'COVID-CO2-tracker Measurement CSV Export'
    puts '========================================='
    puts

    output_dir = ENV['OUTPUT_DIR'] || '/tmp'

    # Validate output directory
    unless Dir.exist?(output_dir)
      puts "Error: Output directory does not exist: #{output_dir}"
      puts 'Please create the directory or set OUTPUT_DIR environment variable.'
      exit 1
    end

    unless File.writable?(output_dir)
      puts "Error: Output directory is not writable: #{output_dir}"
      puts 'Please check permissions or set OUTPUT_DIR to a writable directory.'
      exit 1
    end

    puts "Output directory: #{output_dir}"
    puts 'Starting export...'
    puts

    begin
      result = CsvExportService.export_measurements_to_csv(output_dir)

      if result[:success]
        puts '✅ Export completed successfully!'
        puts "📁 File: #{result[:filepath]}"
        puts "📊 Records exported: #{result[:record_count]}"
        puts "💡 #{result[:message]}"
      else
        puts '❌ Export failed!'
        puts "Error: #{result[:error]}"
        puts result[:message]
        exit 1
      end
    rescue StandardError => e
      puts '❌ Unexpected error during export:'
      puts e.message
      puts
      puts 'Stack trace:'
      puts e.backtrace.join("\n")
      exit 1
    end

    puts
    puts 'Export task completed.'
  end

  desc 'Export CO2 measurement data from PostgreSQL dump file to CSV'
  task :measurements_from_dump, [:dump_file] => :environment do |_task, args|
    puts '========================================='
    puts 'COVID-CO2-tracker CSV Export from Dump'
    puts '========================================='
    puts

    dump_file = args[:dump_file] || ENV.fetch('DUMP_FILE', nil)
    output_dir = ENV['OUTPUT_DIR'] || '/tmp'

    # Validate arguments
    if dump_file.blank?
      puts 'Error: Dump file path is required.'
      puts
      puts 'Usage:'
      puts '  rake export:measurements_from_dump[/path/to/dump.sql]'
      puts '  or set DUMP_FILE environment variable'
      puts
      puts 'Example:'
      puts '  rake export:measurements_from_dump[/tmp/production_backup.sql]'
      puts '  DUMP_FILE=/tmp/backup.sql rake export:measurements_from_dump'
      exit 1
    end

    # Validate dump file
    unless File.exist?(dump_file)
      puts "Error: Dump file does not exist: #{dump_file}"
      exit 1
    end

    # Validate output directory
    unless Dir.exist?(output_dir)
      puts "Error: Output directory does not exist: #{output_dir}"
      puts 'Please create the directory or set OUTPUT_DIR environment variable.'
      exit 1
    end

    unless File.writable?(output_dir)
      puts "Error: Output directory is not writable: #{output_dir}"
      exit 1
    end

    puts "Dump file: #{dump_file}"
    puts "Output directory: #{output_dir}"
    puts
    puts '⚠️  WARNING: This will create a temporary database during processing.'
    puts '   Ensure you have sufficient disk space and database permissions.'
    puts '   The temporary database will be automatically cleaned up.'
    puts

    # Confirmation prompt for production safety
    print 'Continue with export from dump file? (y/N): '
    response = STDIN.gets.chomp.downcase
    unless ['y', 'yes'].include?(response)
      puts 'Export cancelled.'
      exit 0
    end

    puts
    puts 'Starting export from dump file...'
    puts

    begin
      result = CsvExportService.export_from_pg_dump(dump_file, output_dir)

      if result[:success]
        puts '✅ Export from dump completed successfully!'
        puts "📁 File: #{result[:filepath]}"
        puts "📊 Records exported: #{result[:record_count]}"
        puts "💡 #{result[:message]}"
      else
        puts '❌ Export from dump failed!'
        puts "Error: #{result[:error]}"
        puts result[:message]
        exit 1
      end
    rescue StandardError => e
      puts '❌ Unexpected error during export from dump:'
      puts e.message
      puts
      puts 'Stack trace:'
      puts e.backtrace.join("\n")
      exit 1
    end

    puts
    puts 'Export from dump task completed.'
  end

  desc 'Display help information for export tasks'
  task help: :environment do
    puts '========================================='
    puts 'COVID-CO2-tracker CSV Export Help'
    puts '========================================='
    puts
    puts 'Available export tasks:'
    puts
    puts '1. Export from live database:'
    puts '   rake export:measurements_to_csv'
    puts '   Optional: OUTPUT_DIR=/path/to/output rake export:measurements_to_csv'
    puts
    puts '2. Export from PostgreSQL dump file:'
    puts '   rake export:measurements_from_dump[/path/to/dump.sql]'
    puts '   Optional: OUTPUT_DIR=/path/to/output rake export:measurements_from_dump[dump.sql]'
    puts
    puts 'Environment variables:'
    puts '   OUTPUT_DIR - Directory for CSV output (default: /tmp)'
    puts '   DUMP_FILE  - Path to PostgreSQL dump file (for dump export)'
    puts
    puts 'Examples:'
    puts '   # Export from live database to /tmp'
    puts '   rake export:measurements_to_csv'
    puts
    puts '   # Export from live database to custom directory'
    puts '   OUTPUT_DIR=/home/user/exports rake export:measurements_to_csv'
    puts
    puts '   # Export from dump file'
    puts '   rake export:measurements_from_dump[/backup/production.sql]'
    puts
    puts '   # Export from dump with custom output directory'
    puts '   OUTPUT_DIR=/exports DUMP_FILE=/backup/prod.sql rake export:measurements_from_dump'
    puts
    puts 'Privacy & Safety:'
    puts '   - Only exports data available through normal APIs'
    puts '   - Excludes user emails, names, and other PII'
    puts '   - Includes validation checks to prevent data corruption'
    puts '   - Uses batched processing for large datasets'
    puts '   - Temporary databases are automatically cleaned up'
    puts
  end
end

# Default task shows help
desc 'Show help for CSV export tasks'
task export: 'export:help'