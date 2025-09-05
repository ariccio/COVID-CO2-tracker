# frozen_string_literal: true

require 'byebug'
require 'open3'

# Module for end-to-end testing utilities
module EndToEndTest
  OVERRIDE_PORT_FOR_RAILS = {}.freeze

  def self.popen_run(cmd, opts, child_io, parent_io, env) # :nodoc:
    # https://github.com/ruby/open3/blob/c5a7dde80608e724b17647f7f61abec5d2dff50f/lib/open3.rb#LL221C1-L235C6
    pid = spawn(env, *cmd, opts)
    wait_thr = Process.detach(pid)
    child_io.each(&:close)
    result = [*parent_io, wait_thr]
    if defined? yield
      begin
        return yield(*result)
      ensure
        parent_io.each(&:close)
        wait_thr.join
      end
    end
    result
  end

  def self.popen3_that_lets_me_set_fucking_env(cmd, opts, env)
    # https://github.com/ruby/open3/blob/c5a7dde80608e724b17647f7f61abec5d2dff50f/lib/open3.rb#L86

    in_r, in_w = IO.pipe
    opts[:in] = in_r
    in_w.sync = true

    out_r, out_w = IO.pipe
    opts[:out] = out_w

    err_r, err_w = IO.pipe
    opts[:err] = err_w
    puts("cmd: #{cmd}, opts: #{opts}")
    popen_run(cmd, opts, [in_r, out_w, err_w], [in_w, out_r, err_r], env)

  end

  def self.spawn_rails
    # rails_stdin, rails_stdout, rails_stderr, rails_wait_thr = Open3.popen3("rails s", opts: {}, env: {"PORT" => "3000"})
    rails_stdin, rails_stdout, rails_stderr, rails_wait_thr = popen3_that_lets_me_set_fucking_env('rails s --log-to-stdout', {}, { 'PORT' => '3000' })
    # rails_stdin, rails_stdout, rails_stderr, rails_wait_thr = popen3_that_lets_me_set_fucking_env("rails s --help",{}, {"PORT" => "3000"})
    puts 'started!'
    # pp rails_wait_thr
    # pp rails_wait_thr.methods.sort
    # rails_wait_thr
    # rails_stdout.each_line do |line|
    #     puts "RAILS: #{line}"
    # end
    # sleep(2)
    # puts "slept"
    # puts "status: #{rails_wait_thr.value}"
    puts 'reading output...'
    # rails_stderr.close
    # rails_stdin.close
    # rails_stdout.close

    return rails_stdin, rails_stdout, rails_stderr, rails_wait_thr
    # byebug
  end

  def self.spawn_react_frontend
    _react_stdin, _react_stdout, _react_stderr, _react_wait_thr = popen3_that_lets_me_set_fucking_env('yarn start', { chdir: './co2_client' }, { 'PORT' => '3001' })
    # sleep(2)
  end


  def self.run

    _rails_stdin, rails_stdout, rails_stderr, rails_wait_thr = spawn_rails()
    _react_stdin, react_stdout, react_stderr, react_wait_thr = spawn_react_frontend()

    process_outputs(rails_stdout, rails_stderr, react_stdout, react_stderr)

    puts 'done'
    # pp rails_stderr.read
    # pp rails_stdout.read
    # pp react_stdin.read
    # pp react_stderr.read

  rescue IOError => e
    puts "IOError: #{e}"
  ensure
    Process.kill('INT', rails_wait_thr[:pid])
    Process.kill('INT', react_wait_thr[:pid])
    puts 'cleaned up'


  end

  def self.process_outputs(rails_stdout, rails_stderr, react_stdout, react_stderr)
    # Next, look for "compiled sucessfully", or "You can now view co2_client in the browser"
    50.times do
      sleep(1)
      read_process_output('RAILS', rails_stdout, rails_stderr)
      read_process_output('REACT', react_stdout, react_stderr)
    end
  end

  def self.read_process_output(prefix, stdout, stderr)
    read_stream(prefix.to_s, stdout)
    read_stream("#{prefix} ERR", stderr)
  end

  def self.read_stream(label, stream)
    output = stream.read_nonblock(10_000)
    puts "#{label}: #{output}"
    puts 'waiting' if label == 'RAILS'
  rescue IO::EAGAINWaitReadable => e
    puts "not ready yet (#{e})"
    sleep(5)
  end

  private_class_method :process_outputs, :read_process_output, :read_stream
end

# Run the test if executed directly
EndToEndTest.run() if __FILE__ == $PROGRAM_NAME