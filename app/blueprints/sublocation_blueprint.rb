# frozen_string_literal: true
class SublocationBlueprint < Blueprinter::Base
  identifier(:id)
  fields(:description, :place_id)
end