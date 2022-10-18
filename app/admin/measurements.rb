# frozen_string_literal: true

::ActiveAdmin.register ::Measurement do

  belongs_to :device, optional: true 
  # See permitted parameters documentation:
  # https://github.com/activeadmin/activeadmin/blob/master/docs/2-resource-customization.md#setting-up-strong-parameters
  #
  # Uncomment all parameters which should be permitted for assignment
  #
  permit_params(:device_id, :co2ppm, :measurementtime, :place_id, :location_where_inside_info, :crowding)
  #
  # or
  #
  # permit_params do
  #   permitted = [:device_id, :co2ppm, :measurementtime, :place_id, :location_where_inside_info, :crowding]
  #   permitted << :other if params[:action] == 'create' && current_user.admin?
  #   permitted
  # end
end
