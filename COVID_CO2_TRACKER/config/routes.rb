Rails.application.routes.draw do
  # get 'auth/create'
  # get 'auth/destroy'
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html

  namespace :api do
    namespace :v1 do
      resources :users, only: [:create, :show]
      resources :auth, only: [:create]
      resources :device, only: [:create, :show]
      resources :manufacturers, only: [:create, :show]

      get '/all_manufacturers', to: "manufacturers#all_manufacturers"
      delete '/auth', to: "auth#destroy"
      get '/email', to: "auth#get_email"
      resources :keys, only: [:show]
    end
  end
end
