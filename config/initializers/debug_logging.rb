# frozen_string_literal: true

# Helper module for conditional debug logging
# Suppresses timestamp debug messages when running under MCP servers or Rails runner
module DebugLogging
  class << self
    def enabled?
      # Suppress debug logs when:
      # 1. Running under rails runner (often used by MCP servers)
      # 2. Running with MCP_* environment variables
      # 3. Running in a non-interactive terminal (typical for MCP)
      # 4. When SUPPRESS_DEBUG_LOGS is explicitly set
      # 5. Parent process looks like an MCP server

      return false if ENV['SUPPRESS_DEBUG_LOGS']
      return false if running_under_rails_runner?
      return false if running_under_mcp?
      return false if non_interactive_terminal?
      return false if parent_process_is_mcp?

      true
    end

    def log(message)
      return unless enabled?

      # Use Time.now here - Time.zone is not available in initializers
      # This module is specifically for debug output during Rails boot
      puts("#{Time.now.strftime('%H:%M:%S:%L')}: #{message}") # rubocop:disable Rails/TimeZone
    end

    private

    def running_under_rails_runner?
      # Rails runner sets specific indicators
      defined?(Rails::Command::RunnerCommand) &&
        Rails::Command::RunnerCommand.instance_variable_get(:@runner_called) == true
    rescue StandardError
      # Check for rails runner in ARGV as fallback
      ARGV.include?('runner') || ARGV.include?('r')
    end

    def running_under_mcp?
      # Check for MCP-related environment variables
      ENV.keys.any? { |k| k.start_with?('MCP_') } ||
        ENV['RAILS_MCP_SERVER'] ||
        ENV.fetch('IS_MCP_CONTEXT', nil)
    end

    def non_interactive_terminal?
      # MCP servers typically run in non-interactive mode
      !$stdin.tty? && !$stdout.tty?
    end

    def parent_process_is_mcp?
      # Check if parent process name contains MCP-related keywords
      ppid = Process.ppid
      return false if ppid.nil? || ppid == 1 # No parent or init process

      # Try to get parent process info
      parent_info = get_parent_process_info(ppid)
      return false unless parent_info

      # Check if parent process looks like an MCP server
      parent_info.match?(/mcp|node.*rails|deno.*rails|claude|cursor|copilot/i)
    rescue StandardError
      false
    end

    def get_parent_process_info(ppid)
      # Try multiple methods to get parent process info
      try_ps_command(ppid) || try_proc_filesystem(ppid) || try_macos_ps(ppid)
    rescue StandardError
      nil
    end

    def try_ps_command(ppid)
      return nil unless system('which ps > /dev/null 2>&1')

      # Try short format first, then verbose
      output = `ps -p #{ppid} -o comm= 2>/dev/null`.strip
      return output unless output.empty?

      output = `ps -p #{ppid} -o command= 2>/dev/null`.strip
      output.empty? ? nil : output
    end

    def try_proc_filesystem(ppid)
      return nil unless File.exist?("/proc/#{ppid}/cmdline")

      cmdline = File.read("/proc/#{ppid}/cmdline").tr("\0", ' ').strip
      cmdline.empty? ? nil : cmdline
    end

    def try_macos_ps(ppid)
      return nil unless RUBY_PLATFORM.include?('darwin')

      output = `ps -p #{ppid} -o command 2>/dev/null | tail -1`.strip
      output.empty? ? nil : output
    end
  end
end

# Optional: Monkey-patch Kernel for convenience (use with caution)
# This allows using debug_log directly without module prefix
def debug_log(message)
  DebugLogging.log(message)
end