# frozen_string_literal: true

::ActiveAdmin.register ::User do
  # See permitted parameters documentation:
  # https://github.com/activeadmin/activeadmin/blob/master/docs/2-resource-customization.md#setting-up-strong-parameters
  #
  # Uncomment all parameters which should be permitted for assignment
  #
  permit_params :email, :name, :sub_google_uid
  #
  # or
  #
  # permit_params do
  #   permitted = [:email, :name, :sub_google_uid]
  #   permitted << :other if params[:action] == 'create' && current_user.admin?
  #   permitted
  # end
end
