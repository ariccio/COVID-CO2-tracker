# frozen_string_literal: true

class Model < ApplicationRecord
  belongs_to :manufacturer
  has_many :device, dependent: :restrict_with_exception
  # https://guides.rubyonrails.org/association_basics.html#has-many-association-reference
  has_many :measurement, -> { distinct }, through: :device


  validates :name, presence: true
  validates :name, uniqueness: { scope: :manufacturer_id }

  # May need to be a distinct relation?


  # (byebug) pp ActiveAdmin::Comment.find_for_resource_in_namespace(@model, 'admin')
  # [#<ActiveAdmin::Comment:0x0000000109166390
  #   id: 1,
  #   namespace: "admin",
  #   body: "hey hoe",
  #   resource_type: "Model",
  #   resource_id: 2,
  #   author_type: "AdminUser",
  #   author_id: 1,
  #   created_at: Thu, 13 Apr 2023 19:16:01.689649000 UTC +00:00,
  #   updated_at: Thu, 13 Apr 2023 19:16:01.689649000 UTC +00:00>]
  # #<ActiveRecord::Relation [#<ActiveAdmin::Comment id: 1, namespace: "admin", body: "hey hoe", resource_type: "Model", resource_id: 2, author_type: "AdminUser", author_id: 1, created_at: "2023-04-13 19:16:01.689649000 +0000", updated_at: "2023-04-13 19:16:01.689649000 +0000">]>

# (byebug) fartipelago = ActiveAdmin::Comment.find_for_resource_in_namespace(@model, 'admin').select(:id, :body, :author_id)


  def self.show_as_json(model)
    admin_comments_q = ActiveAdmin::Comment.find_for_resource_in_namespace(model, 'admin').select(:id, :body, :author_id)
    # byebug
    {
      model_id: model.id,
      name: model.name,
      manufacturer: model.manufacturer.id,
      count: ::Device.where(model_id: model.id).count,
      measurement_count: model.measurement.count,
      manufacturer_name: model.manufacturer.name,
      admin_comments: admin_comments_q
    }
  end
end
