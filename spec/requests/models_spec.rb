# frozen_string_literal: true

require 'rails_helper'

RSpec.describe('Models', type: :request) do
  describe('GET /models') do
    let(:reasonable_manufacturer_params) { { manufacturer: { name: Faker::Company.name } } }
    let(:new_model_name) { Faker::Device.model_name }
    # https://www.devroom.io/2009/08/20/once-and-for-all-rails-migrations-integer-limit-option/

    context('Successfully create model') do
      before(:each) do
        @user_headers = new_valid_empty_user_req
      end
      it('Successfully creates a new model') do
        post(api_v1_manufacturers_path, headers: @user_headers, params: reasonable_manufacturer_params)
        check_no_error(response, json_response, :created)
        manufacturer_create_response = json_response

        created_manufacturer_id = manufacturer_create_response['manufacturer_id']
        post(api_v1_model_index_path, headers: @user_headers, params: { model: { name: new_model_name, manufacturer_id: created_manufacturer_id } })
        model_response = json_response
        check_no_error(response, model_response, :created)
        # pp model_response

        get(api_v1_manufacturer_path(created_manufacturer_id), headers: @user_headers)

        expected_model = { 'model_id' => model_response['model_id'], 'manufacturer_id' => created_manufacturer_id, 'name' => new_model_name, 'count' => 0 }
        expect(json_response['models']).to(eq([expected_model]))
        # pp json_response["models"]

        get(api_v1_model_path(expected_model['model_id']))
        show_model_response = json_response
        check_no_error(response, show_model_response, :ok)
        expect(show_model_response['name']).to(eq(new_model_name))
        expect(show_model_response['count']).to(eq(0))
        expect(show_model_response['measurement_count']).to(eq(0))
        expect(show_model_response).to(include('admin_comments'))
        expect(show_model_response).not_to(include('admin_comment_farts'))
        # pp show_model_response

        created = ::AdminUser.first_or_create!(email: 'alexander@pooper', password: 'password', password_confirmation: 'password')

        nonsense_comment = Faker::Lorem.sentence
        # ActiveAdmin::Author.find(created.id)
        model_resource = Model.find(expected_model['model_id'])
        created_comment = ActiveAdmin::Comment.first_or_create!(resource: model_resource, namespace: 'admin', author: created, body: nonsense_comment)
        # pp created_comment
        # #<id: 1, namespace: "admin", body: "Explicabo nesciunt quos quia.", resource_type: "Model", resource_id: 1,author_type: "AdminUser", author_id: 1>
        expect(created_comment['body']).to(eq(nonsense_comment))

        get(api_v1_model_path(expected_model['model_id']))
        show_model_response_with_activeadmin_comment = json_response
        expect(show_model_response_with_activeadmin_comment).to(include('admin_comments'))

        expected_admin_comment_author_id = created.id
        expected_admin_comment_body = nonsense_comment
        expect(show_model_response_with_activeadmin_comment['admin_comments'][0]['author_id']).to(eq(expected_admin_comment_author_id))
        expect(show_model_response_with_activeadmin_comment['admin_comments'][0]['body']).to(eq(expected_admin_comment_body))
        # pp show_model_response_with_activeadmin_comment
        # byebug

      end

    end

    context('Fail to create model') do
      let(:max_id) { 9_223_372_036_854_775_807 }
      before(:each) do
        @user_headers = new_valid_empty_user_req
        post(api_v1_manufacturers_path, headers: @user_headers, params: reasonable_manufacturer_params)
        check_no_error(response, json_response, :created)
        @manufacturer_create_response = json_response

      end
      it('Fails with nil name') do
        post(api_v1_model_index_path, headers: @user_headers, params: { model: { name: nil, manufacturer_id: @manufacturer_create_response['manufacturer_id'] } })
        model_response = json_response
        # pp model_response
        formatted_error_check(response, model_response, :bad_request, 'device model creation failed!', "Name can't be blank")
      end


      it('Fails with blank name') do
        post(api_v1_model_index_path, headers: @user_headers, params: { model: { name: '', manufacturer_id: @manufacturer_create_response['manufacturer_id'] } })
        model_response = json_response
        # pp model_response
        formatted_error_check(response, model_response, :bad_request, 'device model creation failed!', "Name can't be blank")
      end

      it('Fails with nil manufacturer_id') do
        post(api_v1_model_index_path, headers: @user_headers, params: { model: { name: new_model_name, manufacturer_id: nil } })
        model_response = json_response
        # pp model_response
        formatted_error_check(response, model_response, :bad_request, 'device model creation failed!', 'Manufacturer must exist')
      end

      it('Fails with nil manufacturer_id and blank name') do
        post(api_v1_model_index_path, headers: @user_headers, params: { model: { name: '', manufacturer_id: nil } })
        model_response = json_response
        # pp model_response
        formatted_error_check(response, model_response, :bad_request, 'device model creation failed!', "Name can't be blank")
      end

      it('fails with invalid manufacturer_id') do
        minimum_invalid_id = (@manufacturer_create_response['manufacturer_id'] + 1)
        # pp minimum_invalid_id
        3.times do
          invalid_id = Faker::Number.between(from: minimum_invalid_id, to: max_id)
          # pp invalid_id
          post(api_v1_model_index_path, headers: @user_headers, params: { model: { name: Faker::Company.name, manufacturer_id: invalid_id } })
          # pp json_response
          formatted_error_check(response, json_response, :bad_request, 'device model creation failed!', 'Manufacturer must exist')
        end
      end

      it('Cannot create same model more than once') do
        created_manufacturer_id = @manufacturer_create_response['manufacturer_id']

        # try first
        new_model_params = { model: { name: new_model_name, manufacturer_id: created_manufacturer_id } }
        post(api_v1_model_index_path, headers: @user_headers, params: new_model_params)
        model_response = json_response
        check_no_error(response, model_response, :created)
        # pp model_response

        get(api_v1_manufacturer_path(created_manufacturer_id), headers: @user_headers)

        expected_model = { 'model_id' => model_response['model_id'], 'manufacturer_id' => created_manufacturer_id, 'name' => new_model_name, 'count' => 0 }
        expect(json_response['models']).to(eq([expected_model]))
        # pp json_response["models"]

        get(api_v1_model_path(expected_model['model_id']))
        show_model_response = json_response
        check_no_error(response, show_model_response, :ok)
        expect(show_model_response['name']).to(eq(new_model_name))
        expect(show_model_response['count']).to(eq(0))
        expect(show_model_response['measurement_count']).to(eq(0))


        first_model_response = show_model_response
        3.times do
          # try second
          post(api_v1_model_index_path, headers: @user_headers, params: new_model_params)
          model_response = json_response

          # error string: 'Name has already been taken', message: 'device model creation failed!'
          # Create model errors: error string: 'Name has already been taken', message: 'device model creation failed!'


          # {"errors"=>[{"message"=>["device model creation failed!"], "error"=>["Name has already been taken"]}]}
          # {"errors"=>[{"message"=>["device model creation failed!"], "error"=>["Name has already been taken"]}]}
          formatted_error_check_array(response, json_response, :bad_request, 'device model creation failed!', ['Name has already been taken'])


          get(api_v1_manufacturer_path(@manufacturer_create_response['manufacturer_id']), headers: @user_headers)
          check_no_error(response, json_response, :ok)
          # pp "----------"
          # pp "----------"
          # pp json_response
          # pp "----------"
          # pp "----------"
          expect(json_response).to(include('name'))
          expect(json_response).to(include('manufacturer_id'))
          expect(json_response).to(include('models'))
          expect(json_response['name']).to(eq(reasonable_manufacturer_params[:manufacturer][:name]))
          # rubocop:disable Layout/FirstHashElementIndentation, Layout/MultilineMethodCallBraceLayout
          expect(json_response['models']).to(eq(
                                               [
                                                 {
                                                   'count' => 0,
                                                   'manufacturer_id' => @manufacturer_create_response['manufacturer_id'],
                                                   'model_id' => first_model_response['model_id'],
                                                   'name' => new_model_name
                                                   }
                                               ]))
        end

        num_models = json_response['models'].count { |model| model['name'] == new_model_name }
        expect(num_models).to(eq(1))
      end
    end
  end
end
