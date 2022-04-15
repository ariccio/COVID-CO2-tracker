module RequestSpecHelper
    def json_response
        # pp response unless response.ok?
        JSON.parse(response.body)
    end
end
