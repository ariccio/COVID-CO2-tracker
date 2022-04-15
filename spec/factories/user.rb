FactoryBot.define do
    factory(:user) do
        email { Faker::Internet.safe_email}
        name {Faker::Name.name}
    end
end
