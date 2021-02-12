Rails.application.routes.draw do
  # get 'auth/create'
  # get 'auth/destroy'
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html

  namespace :api do
    namespace :v1 do
      resources :users, only: [:create, :show]
      resources :auth, only: [:create, :destroy]
    end
  end
end
