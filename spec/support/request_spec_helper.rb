module RequestSpecHelper
    def json_response
        # pp response unless response.ok?
        JSON.parse(response.body)
    end
    # def json_response_explicit(response_input)
    #     JSON.parse(response_input.body)
    # end
    def with_jwt(jwt)
        {
            "Authorization": "Bearer #{jwt}"
        }
    end
    def new_valid_empty_user_req
        new_user = {user: {email: Faker::Internet.safe_email, name: Faker::Name.name, sub: Faker::Alphanumeric.alpha(number: 5), email_verified: true, needs_jwt_value_for_js: true}}
        post(api_v1_auth_index_path, params: new_user)
        new_valid_empty_user = json_response["jwt"]
        new_valid_empty_user_jwt_headers = with_jwt(new_valid_empty_user)
        return new_valid_empty_user_jwt_headers
    end

    def formatted_error_check(response, json_response, status, message_str)
        expect(response).to(have_http_status(status))
        # pp json_response
        pp "in error check helper! checking for '#{message_str}'"
        expect(json_response).to(include("errors"))
        expect(json_response["errors"][0]).to(include("message"))
        expect(json_response["errors"][0]["message"]).to(eq([message_str]))
        expect(json_response["errors"][0]).to(include("error"))

    end
end
