# Be sure to restart your server when you modify this file.
#
# This file eases your Rails 7.0 framework defaults upgrade.
#
# Uncomment each configuration one by one to switch to the new default.
# Once your application is ready to run with all new defaults, you can remove
# this file and set the `config.load_defaults` to `7.0`.
#
# Read the Guide for Upgrading Ruby on Rails for more info on each option.
# https://guides.rubyonrails.org/upgrading_ruby_on_rails.html

Rails.application.config.action_view.button_to_generates_button_tag = true
Rails.application.config.action_view.apply_stylesheet_media_default = false
Rails.application.config.active_support.key_generator_hash_digest_class = OpenSSL::Digest::SHA256
Rails.application.config.active_support.hash_digest_class = OpenSSL::Digest::SHA256
Rails.application.config.active_support.remove_deprecated_time_with_zone_name = true
Rails.application.config.active_support.executor_around_test_case = true
Rails.application.config.active_support.isolation_level = :thread
Rails.application.config.action_mailer.smtp_timeout = 5
Rails.application.config.active_record.automatic_scope_inversing = true
Rails.application.config.active_record.verify_foreign_keys_for_fixtures = true
Rails.application.config.active_record.partial_inserts = false
Rails.application.config.action_controller.raise_on_open_redirects = true
Rails.application.config.action_dispatch.cookies_serializer = :hybrid
Rails.application.config.action_controller.wrap_parameters_by_default = true
Rails.application.config.active_support.use_rfc4122_namespaced_uuids = true
Rails.application.config.action_dispatch.default_headers = {
  "X-Frame-Options" => "SAMEORIGIN",
  "X-XSS-Protection" => "0",
  "X-Content-Type-Options" => "nosniff",
  "X-Download-Options" => "noopen",
  "X-Permitted-Cross-Domain-Policies" => "none",
  "Referrer-Policy" => "strict-origin-when-cross-origin"
}

# Change the format of the cache entry.
# Changing this default means that all new cache entries added to the cache
# will have a different format that is not supported by Rails 6.1 applications.
# Only change this value after your application is fully deployed to Rails 7.0
# and you have no plans to rollback.
# Rails.application.config.active_support.cache_format_version = 7.0


# The ActiveStorage video previewer will now use scene change detection to generate
# better preview images (rather than the previous default of using the first frame
# of the video).
# Rails.application.config.active_storage.video_preview_arguments =
#   "-vf 'select=eq(n\\,0)+eq(key\\,1)+gt(scene\\,0.015),loop=loop=-1:size=2,trim=start_frame=1' -frames:v 1 -f image2"


# Change the variant processor for Active Storage.
# Changing this default means updating all places in your code that
# generate variants to use image processing macros and ruby-vips
# operations. See the upgrading guide for detail on the changes required.
# The `:mini_magick` option is not deprecated; it's fine to keep using it.
# Rails.application.config.active_storage.variant_processor = :vips

