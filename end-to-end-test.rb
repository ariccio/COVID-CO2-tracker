require 'open3'
require 'byebug'

OVERRIDE_PORT_FOR_RAILS = {
    
}

def popen_run(cmd, opts, child_io, parent_io, env) # :nodoc:
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

def popen3_that_lets_me_set_fucking_env(cmd, opts, env)
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

def spawn_rails
    # rails_stdin, rails_stdout, rails_stderr, rails_wait_thr = Open3.popen3("rails s", opts: {}, env: {"PORT" => "3000"})
    rails_stdin, rails_stdout, rails_stderr, rails_wait_thr = popen3_that_lets_me_set_fucking_env("rails s --log-to-stdout",{}, {"PORT" => "3000"})
    # rails_stdin, rails_stdout, rails_stderr, rails_wait_thr = popen3_that_lets_me_set_fucking_env("rails s --help",{}, {"PORT" => "3000"})
    puts "started!"
    # pp rails_wait_thr
    # pp rails_wait_thr.methods.sort
    # rails_wait_thr
    # rails_stdout.each_line do |line|
    #     puts "RAILS: #{line}"
    # end
    # sleep(2)
    # puts "slept"
    # puts "status: #{rails_wait_thr.value}"
    puts "reading output..."
    # rails_stderr.close
    # rails_stdin.close
    # rails_stdout.close
    
    return rails_stdin, rails_stdout, rails_stderr, rails_wait_thr
    # byebug
end

def spawn_react_frontend
    react_stdin, react_stdout, react_stderr, react_wait_thr = popen3_that_lets_me_set_fucking_env("yarn start",{chdir: "./co2_client"}, {"PORT" => "3001"})
    # sleep(2)
end


def run
    begin
        rails_stdin, rails_stdout, rails_stderr, rails_wait_thr = spawn_rails()
        react_stdin, react_stdout, react_stderr, react_wait_thr = spawn_react_frontend()
    

        # Next, look for "compiled sucessfully", or "You can now view co2_client in the browser"
        50.times do
            sleep(1)
            begin
                puts "RAILS: #{rails_stdout.read_nonblock(10000)}"
                puts "waiting"
            rescue IO::EAGAINWaitReadable => e
                puts "not ready yet"
                sleep(5)
            end
            # byebug

            begin
                # if rails_stdout.ready?
                puts "RAILS ERR: #{rails_stderr.read_nonblock(10000)}"
                # end
                puts "REACT: #{react_stdout.read_nonblock(10000)}"
                puts "REACT ERR: #{react_stderr.read_nonblock(10000)}"
                # if react_stdout.ready?
                # end
            rescue IO::EAGAINWaitReadable => e
                puts "not ready yet"
                sleep(5)
            end
            begin
                puts "REACT: #{react_stdout.read_nonblock(10000)}"
                puts "REACT ERR: #{react_stderr.read_nonblock(10000)}"
                # if react_stdout.ready?
                # end
            rescue IO::EAGAINWaitReadable => e
                puts "not ready yet"
                sleep(5)
            end
            begin
                puts "REACT ERR: #{react_stderr.read_nonblock(10000)}"
                # if react_stdout.ready?
                # end
            rescue IO::EAGAINWaitReadable => e
                puts "not ready yet"
                sleep(5)
            end

        end
        # byebug

        puts "done"
        # pp rails_stderr.read
        # pp rails_stdout.read
        # pp react_stdin.read
        # pp react_stderr.read

    rescue IOError => e
        puts "IOError: #{e}"
    ensure
        Process.kill("INT", rails_wait_thr[:pid])
        Process.kill("INT", react_wait_thr[:pid])
        puts "cleaned up"
    end

end


run()