ActiveAdmin.register Place do
  # See permitted parameters documentation:
  # https://github.com/activeadmin/activeadmin/blob/master/docs/2-resource-customization.md#setting-up-strong-parameters
  #
  # Uncomment all parameters which should be permitted for assignment
  #
  permit_params :google_place_id, :last_fetched, :place_lat, :place_lng
  #
  # or
  #
  # permit_params do
  #   permitted = [:google_place_id, :last_fetched, :place_lat, :place_lng]
  #   permitted << :other if params[:action] == 'create' && current_user.admin?
  #   permitted
  # end
end
