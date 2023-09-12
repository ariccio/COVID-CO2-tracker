# frozen_string_literal: true

class SubLocationSerializer
  # TODO: add normalizer https://edgeguides.rubyonrails.org/7_1_release_notes.html#add-activerecord-base-normalizes
  include ::JSONAPI::Serializer
  attributes :measurement

  belongs_to :place
  has_many :measurement
  set_type :sub_location
end
