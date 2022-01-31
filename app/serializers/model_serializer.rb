# frozen_string_literal: true

class ModelSerializer
  include ::JSONAPI::Serializer
  attributes :name
end
