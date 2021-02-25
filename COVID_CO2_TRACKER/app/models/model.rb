# frozen_string_literal: true

class Model < ApplicationRecord
  belongs_to :manufacturer
  # May need to be a distinct relation?
end
