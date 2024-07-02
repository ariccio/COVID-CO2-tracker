namespace(:checks) do
    desc('runs various static analysis checks')
    task (:active_record_doctor) do
        Rake::Task['active_record_doctor'].invoke
    end
    # task (:rubocop) do
    #     Rake::Task["rubocop"].invoke
    # end
    # task (:all) do
    #     Rake::Task["active_record_doctor"].invoke
    #     Rake::Task["rubocop"].invoke
    # end
end
