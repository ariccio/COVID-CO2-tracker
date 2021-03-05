# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2021_03_05_224113) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "device_models", force: :cascade do |t|
    t.string "name"
    t.bigint "manufacturer_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["manufacturer_id"], name: "index_device_models_on_manufacturer_id"
  end

  create_table "devices", force: :cascade do |t|
    t.string "serial"
    t.bigint "model_id", null: false
    t.bigint "user_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["model_id"], name: "index_devices_on_model_id"
    t.index ["user_id"], name: "index_devices_on_user_id"
  end

  create_table "manufacturers", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "measurements", force: :cascade do |t|
    t.bigint "device_id", null: false
    t.integer "co2ppm"
    t.datetime "measurementtime"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.bigint "place_id", null: false
    t.index ["device_id"], name: "index_measurements_on_device_id"
    t.index ["place_id"], name: "index_measurements_on_place_id"
  end

  create_table "models", force: :cascade do |t|
    t.string "name"
    t.bigint "manufacturer_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["manufacturer_id"], name: "index_models_on_manufacturer_id"
  end

  create_table "places", force: :cascade do |t|
    t.string "google_place_id"
    t.datetime "last_fetched"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["google_place_id"], name: "index_places_on_google_place_id", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "email"
    t.string "password_digest"
    t.text "auth_token"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  add_foreign_key "device_models", "manufacturers"
  add_foreign_key "devices", "models"
  add_foreign_key "devices", "users"
  add_foreign_key "measurements", "devices"
  add_foreign_key "measurements", "places"
  add_foreign_key "models", "manufacturers"
end
