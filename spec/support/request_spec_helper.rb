module RequestSpecHelper
    def json_response
        # pp response unless response.ok?
        JSON.parse(response.body)
    end
    def with_jwt(jwt)
        {
            "Authorization": "Bearer #{jwt}"
        }
    end
end
