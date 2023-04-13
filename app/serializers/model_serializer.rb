# frozen_string_literal: true

class ModelSerializer
  include ::JSONAPI::Serializer


  # create_table "models", force: :cascade do |t|
  #   t.string "name", null: false
  #   t.bigint "manufacturer_id", null: false
  #   t.datetime "created_at", null: false
  #   t.datetime "updated_at", null: false
  #   t.index ["manufacturer_id"], name: "index_models_on_manufacturer_id"
  # end

  # def self.show_as_json(model)
  #   {
  #     model_id: model.id,
  #     name: model.name,
  #     manufacturer: model.manufacturer.id,
  #     count: ::Device.where(model_id: model.id).count,
  #     measurement_count: model.measurement.count,
  #     manufacturer_name: model.manufacturer.name
  #   }
  # end


  # {:model_id=>2, :name=>"Contoso 1", :manufacturer=>3, :count=>1, :measurement_count=>0, :manufacturer_name=>"Contoso"}

  attributes :name, :manufacturer
end
