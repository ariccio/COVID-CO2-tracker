require 'rubygems'
require 'gems'


CURRENT_VERSION = '1.2.0'
GEM_NAME = 'googleauth'



def run
    correct_latest_version = Gems.versions(GEM_NAME)[0]["number"]
    # pp Gems.versions(GEM_NAME)[0]["number"]
    if (correct_latest_version == CURRENT_VERSION)
        puts "Probably no new version of #{GEM_NAME} available."
        # pp "\"latest_version\" #{Gems.latest_version('GEM_NAME')}"
        return
    end
    
    puts "Possible new version #{GEM_NAME} available: #{correct_latest_version}. Check to see if it fixes https://github.com/googleapis/google-auth-library-ruby/issues/381"
    # Lefthook will treat this as a fail and stop the push.
    exit(1)
end

run

