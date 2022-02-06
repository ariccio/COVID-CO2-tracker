```
irb(main):004:0> ActiveRecord::Base.connection.execute(Place.all.select(:place_lng, :place_lat, :id).to_sql).to_a
   (0.5ms)  SELECT "places"."place_lng", "places"."place_lat", "places"."id" FROM "places"
```


produces:


```
=> [{"place_lng"=>nil, "place_lat"=>nil, "id"=>8}, {"place_lng"=>nil, "place_lat"=>nil, "id"=>12}, {"place_lng"=>nil, "place_lat"=>nil, "id"=>14}, {"place_lng"=>nil, "place_lat"=>nil, "id"=>15}, {"place_lng"=>nil, "place_lat"=>nil, "id"=>16}, {"place_lng"=>nil, "place_lat"=>nil, "id"=>17}, {"place_lng"=>nil, "place_lat"=>nil, "id"=>18}, {"place_lng"=>nil, "place_lat"=>nil, "id"=>19}, {"place_lng"=>-0.73964848e2, "place_lat"=>0.40764413e2, "id"=>6}, {"place_lng"=>-0.73964245e2, "place_lat"=>0.40764358e2, "id"=>20}, {"place_lng"=>-0.73923588e2, "place_lat"=>0.40756438e2, "id"=>21}, {"place_lng"=>-0.73952528e2, "place_lat"=>0.4078294e2, "id"=>23}, {"place_lng"=>-0.74008863e2, "place_lat"=>0.40739588e2, "id"=>24}, {"place_lng"=>-0.73965683e2, "place_lat"=>0.40769882e2, "id"=>11}, {"place_lng"=>-0.73966502e2, "place_lat"=>0.40769442e2, "id"=>30}, {"place_lng"=>-0.73967039e2, "place_lat"=>0.4076902e2, "id"=>31}, {"place_lng"=>-0.7396704e2, "place_lat"=>0.4076925e2, "id"=>32}, {"place_lng"=>nil, "place_lat"=>nil, "id"=>34}, {"place_lng"=>-0.73966524e2, "place_lat"=>0.4076871e2, "id"=>36}, {"place_lng"=>-0.73967299e2, "place_lat"=>0.40768725e2, "id"=>37}, {"place_lng"=>-0.73966303e2, "place_lat"=>0.40770148e2, "id"=>38}, {"place_lng"=>-0.73966566e2, "place_lat"=>0.4076947e2, "id"=>39}, {"place_lng"=>-0.73959913e2, "place_lat"=>0.40770075e2, "id"=>40}, {"place_lng"=>-0.7396577e2, "place_lat"=>0.40769599e2, "id"=>42}, {"place_lng"=>-0.73924054e2, "place_lat"=>0.40761129e2, "id"=>45}, {"place_lng"=>-0.8402794e1, "place_lat"=>0.4337546e2, "id"=>47}, {"place_lng"=>-0.8406544e1, "place_lat"=>0.43377607e2, "id"=>48}, {"place_lng"=>-0.73965838e2, "place_lat"=>0.4076221e2, "id"=>27}, {"place_lng"=>-0.73966149e2, "place_lat"=>0.40768496e2, "id"=>9}, {"place_lng"=>-0.73952903e2, "place_lat"=>0.40765063e2, "id"=>50}, {"place_lng"=>-0.73965915e2, "place_lat"=>0.40768731e2, "id"=>2}, {"place_lng"=>-0.73966677e2, "place_lat"=>0.40768353e2, "id"=>29}, {"place_lng"=>-0.73964914e2, "place_lat"=>0.40770102e2, "id"=>13}, {"place_lng"=>-0.73949129e2, "place_lat"=>0.40773521e2, "id"=>46}, {"place_lng"=>0.15312183e3, "place_lat"=>-0.27394214e2, "id"=>61}, {"place_lng"=>-0.73963887e2, "place_lat"=>0.40767874e2, "id"=>54}, {"place_lng"=>-0.73962534e2, "place_lat"=>0.40766638e2, "id"=>10}, {"place_lng"=>-0.73962846e2, "place_lat"=>0.4076642e2, "id"=>57}, {"place_lng"=>-0.73971834e2, "place_lat"=>0.40767778e2, "id"=>59}, {"place_lng"=>-0.7398059e2, "place_lat"=>0.40770873e2, "id"=>60}, {"place_lng"=>-0.73968585e2, "place_lat"=>0.40761171e2, "id"=>44}, {"place_lng"=>-0.73960081e2, "place_lat"=>0.40769687e2, "id"=>41}, {"place_lng"=>-0.73963488e2, "place_lat"=>0.40757925e2, "id"=>28}, {"place_lng"=>-0.73981784e2, "place_lat"=>0.40726429e2, "id"=>25}, {"place_lng"=>-0.73962361e2, "place_lat"=>0.40767686e2, "id"=>26}, {"place_lng"=>-0.73965637e2, "place_lat"=>0.40769179e2, "id"=>7}, {"place_lng"=>-0.7395931e2, "place_lat"=>0.40767142e2, "id"=>43}, {"place_lng"=>-0.7238853e2, "place_lat"=>0.40887051e2, "id"=>62}, {"place_lng"=>-0.73954287e2, "place_lat"=>0.40764308e2, "id"=>63}, {"place_lng"=>-0.73953794e2, "place_lat"=>0.40766364e2, "id"=>52}, {"place_lng"=>-0.73953588e2, "place_lat"=>0.40770339e2, "id"=>22}, {"place_lng"=>-0.73955676e2, "place_lat"=>0.40762487e2, "id"=>49}]

```

Thinking about https://josh.mn/2020/05/01/serializing-one-million-records/



See also:
https://github.com/joshmn/json-benchmark/blob/884eaa5a682a12a5751d2812a1869d0b89bc228a/app/controllers/homes_controller.rb
https://github.com/joshmn/json-benchmark/blob/22a86981d03d4450663b95275121a420ffc5d9ce/superbench.rb#L43

https://github.com/joshmn/json-benchmark/blob/22a86981d03d4450663b95275121a420ffc5d9ce/config/initializers/strategies.rb#L127
https://github.com/joshmn/json-benchmark/blob/master/app/serializers/fast/hash_serializer.rb
https://github.com/joshmn/json-benchmark/blob/master/app/serializers/fast/home_serializer.rb
https://github.com/joshmn/json-benchmark/blob/master/app/serializers/asm_ar_serializer.rb
https://github.com/joshmn/json-benchmark/blob/master/app/serializers/asm_serializer.rb