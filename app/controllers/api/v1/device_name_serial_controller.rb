module Api
  module V1
    class DeviceNameSerialController < ApiController
      skip_before_action :authorized, only: [:ids_to_names]
      def ids_to_names
        found = Device.find(device_names_params.fetch(:ids))
        hash = DeviceNameSerialSerializer.new(found).serializable_hash
        # byebug
        render(
          json: {
            devices: hash
          }, status: :ok
        )
      rescue ::ActiveRecord::RecordNotFound => e
        render(
          json: {
            errors: [create_activerecord_error('device not found!', e)]
          },
          status: :not_found
        )
      end

      def device_names_params
        params.require(:device_ids).permit(ids: [])
      end
    end
  end
end
