# frozen_string_literal: true

::Rails.application.routes.draw do
  devise_for :admin_users, ActiveAdmin::Devise.config
  ActiveAdmin.routes(self)
  # get 'auth/create'
  # get 'auth/destroy'
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html

  namespace :api do
    namespace :v1 do
      resources :users, only: [:create, :show]
      resources :auth, only: [:create]
      resources :device, only: [:create, :show, :destroy]
      resources :manufacturers, only: [:create, :show]
      resources :model, only: [:create, :show]
      resources :places, only: [:show, :create]
      resources :measurement, only: [:create, :destroy, :show]

      # Hmm, not used yet.
      resources :sub_locations

      get 'stats/show'
      get '/all_manufacturers', to: 'manufacturers#all_manufacturers'
      delete '/auth', to: 'auth#destroy'
      get '/email', to: 'auth#email'
      get '/places_by_google_place_id/:google_place_id', to: 'places#show_by_google_place_id'
      get '/places_by_google_place_id_exists/:google_place_id', to: 'places#place_by_google_place_id_exists'
      get '/my_devices', to: 'users#my_devices'
      # post '/places_near', to: 'places#near'
      post '/places_in_bounds', to: 'places#in_bounds'
      post '/google_login_token', to: 'auth#token_from_google'
      get '/user_last_measurement', to: 'users#last_measurement'
      resources :keys, only: [:show]
      post '/device_name_serial/device_ids_to_names', to: 'device_name_serial#ids_to_names'

      get '/model/:id/measurements', to: 'model#measurements'
    end
  end
  # get '/', to: 'application#fallback_index_html'
  get '*path', to: 'application#fallback_index_html', constraints: lambda { |request|
    !request.xhr? && request.format.html?
  }
end
