from https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/bluetooth/bluetooth_uuid.cc;drc=d2ce916c6580b36d5032a2368a9477ca9eebf1ff;l=27

```
          // https://www.bluetooth.com/specifications/gatt/services
          {"generic_access", 0x1800},
          {"generic_attribute", 0x1801},
          {"immediate_alert", 0x1802},
          {"link_loss", 0x1803},
          {"tx_power", 0x1804},
          {"current_time", 0x1805},
          {"reference_time_update", 0x1806},
          {"next_dst_change", 0x1807},
          {"glucose", 0x1808},
          {"health_thermometer", 0x1809},
          {"device_information", 0x180A},
          {"heart_rate", 0x180D},
          {"phone_alert_status", 0x180E},
          {"battery_service", 0x180F},
          {"blood_pressure", 0x1810},
          {"alert_notification", 0x1811},
          {"human_interface_device", 0x1812},
          {"scan_parameters", 0x1813},
          {"running_speed_and_cadence", 0x1814},
          {"automation_io", 0x1815},
          {"cycling_speed_and_cadence", 0x1816},
          {"cycling_power", 0x1818},
          {"location_and_navigation", 0x1819},
          {"environmental_sensing", 0x181A},
          {"body_composition", 0x181B},
          {"user_data", 0x181C},
          {"weight_scale", 0x181D},
          {"bond_management", 0x181E},
          {"continuous_glucose_monitoring", 0x181F},
          {"internet_protocol_support", 0x1820},
          {"indoor_positioning", 0x1821},
          {"pulse_oximeter", 0x1822},
          {"http_proxy", 0x1823},
          {"transport_discovery", 0x1824},
          {"object_transfer", 0x1825},
          {"fitness_machine", 0x1826},
          {"mesh_provisioning", 0x1827},
          {"mesh_proxy", 0x1828},
          {"reconnection_configuration", 0x1829},
```

I tried several variations of datastructures to make this easy...

```
          ['1800', "generic_access"],
          ['1801', "generic_attribute"],
          ['1802', "immediate_alert"],
          ['1803', "link_loss"],
          ['1804', "tx_power"],
          ['1805', "current_time"],
          ['1806', "reference_time_update"],
          ['1807', "next_dst_change"],
          ['1808', "glucose"],
          ['1809', "health_thermometer"],
          ['180A', "device_information"],
          ['180D', "heart_rate"],
          ['180E', "phone_alert_status"],
          ['180F', "battery_service"],
          ['1810', "blood_pressure"],
          ['1811', "alert_notification"],
          ['1812', "human_interface_device"],
          ['1813', "scan_parameters"],
          ['1814', "running_speed_and_cadence"],
          ['1815', "automation_io"],
          ['1816', "cycling_speed_and_cadence"],
          ['1818', "cycling_power"],
          ['1819', "location_and_navigation"],
          ['181A', "environmental_sensing"],
          ['181B', "body_composition"],
          ['181C', "user_data"],
          ['181D', "weight_scale"],
          ['181E', "bond_management"],
          ['181F', "continuous_glucose_monitoring"],
          ['1820', "internet_protocol_support"],
          ['1821', "indoor_positioning"],
          ['1822', "pulse_oximeter"],
          ['1823', "http_proxy"],
          ['1824', "transport_discovery"],
          ['1825', "object_transfer"],
          ['1826', "fitness_machine"],
          ['1827', "mesh_provisioning"],
          ['1828', "mesh_proxy"],
          ['1829', "reconnection_configuration"],
```


```
          ['0x1800', "generic_access"],
          ['0x1801', "generic_attribute"],
          ['0x1802', "immediate_alert"],
          ['0x1803', "link_loss"],
          ['0x1804', "tx_power"],
          ['0x1805', "current_time"],
          ['0x1806', "reference_time_update"],
          ['0x1807', "next_dst_change"],
          ['0x1808', "glucose"],
          ['0x1809', "health_thermometer"],
          ['0x180A', "device_information"],
          ['0x180D', "heart_rate"],
          ['0x180E', "phone_alert_status"],
          ['0x180F', "battery_service"],
          ['0x1810', "blood_pressure"],
          ['0x1811', "alert_notification"],
          ['0x1812', "human_interface_device"],
          ['0x1813', "scan_parameters"],
          ['0x1814', "running_speed_and_cadence"],
          ['0x1815', "automation_io"],
          ['0x1816', "cycling_speed_and_cadence"],
          ['0x1818', "cycling_power"],
          ['0x1819', "location_and_navigation"],
          ['0x181A', "environmental_sensing"],
          ['0x181B', "body_composition"],
          ['0x181C', "user_data"],
          ['0x181D', "weight_scale"],
          ['0x181E', "bond_management"],
          ['0x181F', "continuous_glucose_monitoring"],
          ['0x1820', "internet_protocol_support"],
          ['0x1821', "indoor_positioning"],
          ['0x1822', "pulse_oximeter"],
          ['0x1823', "http_proxy"],
          ['0x1824', "transport_discovery"],
          ['0x1825', "object_transfer"],
          ['0x1826', "fitness_machine"],
          ['0x1827', "mesh_provisioning"],
          ['0x1828', "mesh_proxy"],
          ['0x1829', "reconnection_configuration"],
```

```
          [0x1800, "generic_access"],
          [0x1801, "generic_attribute"],
          [0x1802, "immediate_alert"],
          [0x1803, "link_loss"],
          [0x1804, "tx_power"],
          [0x1805, "current_time"],
          [0x1806, "reference_time_update"],
          [0x1807, "next_dst_change"],
          [0x1808, "glucose"],
          [0x1809, "health_thermometer"],
          [0x180A, "device_information"],
          [0x180D, "heart_rate"],
          [0x180E, "phone_alert_status"],
          [0x180F, "battery_service"],
          [0x1810, "blood_pressure"],
          [0x1811, "alert_notification"],
          [0x1812, "human_interface_device"],
          [0x1813, "scan_parameters"],
          [0x1814, "running_speed_and_cadence"],
          [0x1815, "automation_io"],
          [0x1816, "cycling_speed_and_cadence"],
          [0x1818, "cycling_power"],
          [0x1819, "location_and_navigation"],
          [0x181A, "environmental_sensing"],
          [0x181B, "body_composition"],
          [0x181C, "user_data"],
          [0x181D, "weight_scale"],
          [0x181E, "bond_management"],
          [0x181F, "continuous_glucose_monitoring"],
          [0x1820, "internet_protocol_support"],
          [0x1821, "indoor_positioning"],
          [0x1822, "pulse_oximeter"],
          [0x1823, "http_proxy"],
          [0x1824, "transport_discovery"],
          [0x1825, "object_transfer"],
          [0x1826, "fitness_machine"],
          [0x1827, "mesh_provisioning"],
          [0x1828, "mesh_proxy"],
          [0x1829, "reconnection_configuration"],
```