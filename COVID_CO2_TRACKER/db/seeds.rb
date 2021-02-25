# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

# Device.destroy_by(serial: "fart")
# Model.destroy_by(name: "Contoso 1")
# Manufacturer.destroy_by(name: "Contoso")

contoso = ::Manufacturer.find_or_create_by!(name: 'Contoso')

contoso_one =
    ::Model.find_or_create_by!(name: 'Contoso 1') do |dm|
        dm.manufacturer = contoso
    end

first_device =
    ::Device.find_or_create_by!(serial: 'fart') do |di|
        di.model = contoso_one
        di.user = ::User.first
    end

pp first_device

me = ::User.find_by(usename: 'alexander@alexander')
me.devices.first.measurements.create!(co2ppm: 500)

# YES THIS WORKS!:
# irb(main):005:0> User.first.devices.first.measurements.create!(co2ppm: 400)
#   User Load (0.3ms)  SELECT "users".* FROM "users" ORDER BY "users"."id" ASC LIMIT ?  [["LIMIT", 1]]
#   Device Load (0.2ms)  SELECT "devices".* FROM "devices" WHERE "devices"."user_id" = ? ORDER BY "devices"."id" ASC LIMIT ?  [["user_id", 1], ["LIMIT", 1]]
#   TRANSACTION (0.1ms)  begin transaction
#   Measurement Create (1.4ms)  INSERT INTO "measurements" ("device_id", "co2ppm", "created_at", "updated_at") VALUES (?, ?, ?, ?)  [["device_id", 1], ["co2ppm", 400], ["created_at", "2021-02-16 01:09:54.353737"], ["updated_at", "2021-02-16 01:09:54.353737"]]
#   TRANSACTION (102.4ms)  commit transaction
# => #<Measurement id: 2, device_id: 1, co2ppm: 400, measurementtime: nil, created_at: "2021-02-16 01:09:54.353737000 +0000", updated_at: "2021-02-16 01:09:54.353737000 +0000">
