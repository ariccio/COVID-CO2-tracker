class SubLocation < ApplicationRecord
  belongs_to :place
  has_many :measurement, dependent: :restrict_with_exception
  # validates :description, presence: true
end
