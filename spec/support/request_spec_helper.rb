# frozen_string_literal: true

module RequestSpecHelper
  def json_response
      # pp response unless response.ok?
    JSON.parse(response.body)
  end
    # def json_response_explicit(response_input)
    #     JSON.parse(response_input.body)
    # end
  def with_jwt(jwt)
    raise Error if jwt.nil?
      raise Error if jwt.blank?

      {
        Authorization: "Bearer #{jwt}"
      }
  end
  def invalid_jwt_header
    { Authorization: 'Bearer fartipelago' }
  end
  def new_user_params
    f = Faker::Omniauth.google

      # pp f[:extra][:id_info][:sub]
      # https://github.com/faker-ruby/faker/blob/master/doc/default/omniauth.md
      { user: { email: f[:info][:email], name: f[:info][:name], sub: f[:extra][:id_info][:sub], email_verified: true, needs_jwt_value_for_js: true } }
  end
  def new_valid_empty_user_req
    f = Faker::Omniauth.google

      new_user = { user: { email: f[:info][:email], name: f[:info][:name], sub: f[:extra][:id_info][:sub], email_verified: true, needs_jwt_value_for_js: true } }
      post(api_v1_auth_index_path, params: new_user)
      new_valid_empty_user = json_response['jwt']
      new_valid_empty_user_jwt_headers = with_jwt(new_valid_empty_user)
      return new_valid_empty_user_jwt_headers
  end

  def check_no_error(response, json_response, status)
    expect(response).to(be_successful)
      expect(response).to(have_http_status(status))
  end
  def formatted_error_check(response, json_response, status, message_str, error_object_str)
    expect(response).to(have_http_status(status))
      # pp json_response
      # pp "in error check helper! checking for '#{message_str}'"
      expect(json_response).to(include('errors'))
      expect(json_response['errors'][0]).to(include('message'))
      expect(json_response['errors'][0]['message']).to(eq([message_str]))
      expect(json_response['errors'][0]).to(include('error'))
      expect(json_response['errors'][0]['error']).to(include(error_object_str)) unless error_object_str.nil?
      # pp "expected message_str: '#{message_str}', error: '#{json_response["errors"][0]["error"]}'"
  end
  def formatted_error_check_array(response, json_response, status, message_str, error_object_array)
      # ONLY CHECKS FIRST ONE, it's fine, yolo lmao

    expect(response).to(have_http_status(status))
      # pp json_response
      # pp "in error check helper! checking for '#{message_str}'"
      expect(json_response).to(include('errors'))
      expect(json_response['errors'][0]).to(include('message'))
      expect(json_response['errors'][0]['message']).to(eq([message_str]))
      expect(json_response['errors'][0]).to(include('error'))
      expect(json_response['errors'][0]['error']).to(eq(error_object_array)) unless error_object_array.nil?
      # pp "expected message_str: '#{message_str}', error: '#{json_response["errors"][0]["error"]}'"
  end

  def formatted_error_check_with_json(response, json_response, status, message_str, error_object)
    formatted_error_check(response, json_response, status, message_str, nil)
      parsed = JSON.parse(json_response['errors'][0]['error'][0])
      expect(parsed).to(include(error_object))
  end

end
