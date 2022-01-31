# frozen_string_literal: true

class ApplicationController < ::ActionController::Base
  protect_from_forgery with: :exception
  def fallback_index_html
    # Rails.logger.info('rendering client page')
    render(file: Rails.root.join('public', 'index.html'))
  end
end
