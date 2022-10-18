# frozen_string_literal: true

::ActiveAdmin.register ::User do
  # See permitted parameters documentation:
  # https://github.com/activeadmin/activeadmin/blob/master/docs/2-resource-customization.md#setting-up-strong-parameters
  #
  # Uncomment all parameters which should be permitted for assignment
  #
  permit_params(:email, :name, :sub_google_uid)
  #
  # or
  #
  # permit_params do
  #   permitted = [:email, :name, :sub_google_uid]
  #   permitted << :other if params[:action] == 'create' && current_user.admin?
  #   permitted
  # end
  show() do
    panel("all user measurements") do
      # table_for(user.measurement, sortable: true) do
      #   column(:measurement)
      #   column(:co2ppm)
      #   column(:measurementtime) 
      # end
      table_for(user.measurement) do

        # YES this sucks but will finish dev later.
        if Rails.env.development?
          byebug          
        end
        column(:measurement) do |measurement|
          measurement
        end
        column(:co2ppm) do |co2ppm|
          co2ppm.co2ppm
          # pp co2ppm
        end
        column(:time) do |time|
          time.measurementtime
        end
      end
    end
  end
end
