# frozen_string_literal: true

::Rails.application.routes.draw do
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
      resources :places, only: [:show]

      get '/all_manufacturers', to: 'manufacturers#all_manufacturers'
      delete '/auth', to: 'auth#destroy'
      get '/email', to: 'auth#email'
      get '/places_by_google_place_id/:google_place_id', to: 'places#show_by_google_place_id'
      get '/my_devices', to: 'users#my_devices'
      resources :keys, only: [:show]
    end
  end
end
