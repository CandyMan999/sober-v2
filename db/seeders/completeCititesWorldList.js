const CITIES = [
  {
    "city": "Aba",
    "latitude": 5.10658,
    "longitude": 7.36667
  },
  {
    "city": "Abeokuta",
    "latitude": 7.15571,
    "longitude": 3.34509
  },
  {
    "city": "Abidjan",
    "latitude": 5.3453,
    "longitude": -4.0244
  },
  {
    "city": "Abidjan",
    "latitude": 5.30966,
    "longitude": -4.01266
  },
  {
    "city": "Abilene",
    "latitude": 32.4487364,
    "longitude": -99.73314390000002
  },
  {
    "city": "Abobo",
    "latitude": 5.41613,
    "longitude": -4.0159
  },
  {
    "city": "Abu Dhabi",
    "latitude": 24.4539,
    "longitude": 54.3773
  },
  {
    "city": "Abu Dhabi",
    "latitude": 24.46667,
    "longitude": 54.36667
  },
  {
    "city": "Abū Ghurayb",
    "latitude": 33.30563,
    "longitude": 44.18477
  },
  {
    "city": "Abuja",
    "latitude": 9.0765,
    "longitude": 7.3986
  },
  {
    "city": "Abuja",
    "latitude": 9.05785,
    "longitude": 7.49508
  },
  {
    "city": "Acapulco de Juárez",
    "latitude": 16.86336,
    "longitude": -99.8901
  },
  {
    "city": "Accra",
    "latitude": 5.6037,
    "longitude": -0.187
  },
  {
    "city": "Accra",
    "latitude": 5.586,
    "longitude": -0.186
  },
  {
    "city": "Accra",
    "latitude": 5.55602,
    "longitude": -0.1969
  },
  {
    "city": "Adana",
    "latitude": 36.985,
    "longitude": 35.28809
  },
  {
    "city": "Adana",
    "latitude": 37.00167,
    "longitude": 35.32889
  },
  {
    "city": "Addis Ababa",
    "latitude": 8.9806,
    "longitude": 38.7578
  },
  {
    "city": "Addis Ababa",
    "latitude": 9.02497,
    "longitude": 38.74689
  },
  {
    "city": "Adelaide",
    "latitude": -34.9285,
    "longitude": 138.6007
  },
  {
    "city": "Adelaide",
    "latitude": -34.92866,
    "longitude": 138.59863
  },
  {
    "city": "Adıyaman",
    "latitude": 37.75,
    "longitude": 38.25
  },
  {
    "city": "Afyonkarahisar",
    "latitude": 38.75,
    "longitude": 30.66667
  },
  {
    "city": "Agadir",
    "latitude": 30.42018,
    "longitude": -9.59815
  },
  {
    "city": "Agra",
    "latitude": 27.18333,
    "longitude": 78.01667
  },
  {
    "city": "Aguascalientes",
    "latitude": 21.88234,
    "longitude": -102.28259
  },
  {
    "city": "Ahmedabad",
    "latitude": 23.02579,
    "longitude": 72.58727
  },
  {
    "city": "Ahvaz",
    "latitude": 31.31901,
    "longitude": 48.6842
  },
  {
    "city": "Akron",
    "latitude": 41.0814,
    "longitude": -81.519
  },
  {
    "city": "Al Aḩmadī",
    "latitude": 29.07694,
    "longitude": 48.08389
  },
  {
    "city": "Al Başrah al Qadīmah",
    "latitude": 30.50316,
    "longitude": 47.81507
  },
  {
    "city": "Al Batinah South Governorate",
    "latitude": 23.45,
    "longitude": 57.7
  },
  {
    "city": "Al Ḩudaydah",
    "latitude": 14.79781,
    "longitude": 42.95452
  },
  {
    "city": "Al Mawşil al Jadīdah",
    "latitude": 36.33271,
    "longitude": 43.10555
  },
  {
    "city": "Alagoas",
    "latitude": -9.58333,
    "longitude": -36.41667
  },
  {
    "city": "Albany",
    "latitude": 42.6525793,
    "longitude": -73.7562317
  },
  {
    "city": "Albany",
    "latitude": 31.5785074,
    "longitude": -84.15574099999999
  },
  {
    "city": "Albuquerque",
    "latitude": 35.0853336,
    "longitude": -106.6055534
  },
  {
    "city": "Aleppo",
    "latitude": 36.2021,
    "longitude": 37.1343
  },
  {
    "city": "Aleppo",
    "latitude": 36.20124,
    "longitude": 37.16117
  },
  {
    "city": "Alexandria",
    "latitude": 38.8048355,
    "longitude": -77.0469214
  },
  {
    "city": "Alexandria",
    "latitude": 31.2001,
    "longitude": 29.9187
  },
  {
    "city": "Alexandria",
    "latitude": 31.3112936,
    "longitude": -92.4451371
  },
  {
    "city": "Alexandria",
    "latitude": 31.20176,
    "longitude": 29.91582
  },
  {
    "city": "Algiers",
    "latitude": 36.7538,
    "longitude": 3.0588
  },
  {
    "city": "Algiers",
    "latitude": 36.73225,
    "longitude": 3.08746
  },
  {
    "city": "Alīgarh",
    "latitude": 27.88145,
    "longitude": 78.07464
  },
  {
    "city": "Allahābād",
    "latitude": 25.44478,
    "longitude": 81.84322
  },
  {
    "city": "Allentown",
    "latitude": 40.6084305,
    "longitude": -75.4901833
  },
  {
    "city": "Almaty",
    "latitude": 43.222,
    "longitude": 76.8512
  },
  {
    "city": "Almaty",
    "latitude": 43.25667,
    "longitude": 76.92861
  },
  {
    "city": "Altayskiy Kray",
    "latitude": 52.5,
    "longitude": 83
  },
  {
    "city": "Altoona",
    "latitude": 40.5186809,
    "longitude": -78.3947359
  },
  {
    "city": "Álvaro Obregón",
    "latitude": 19.35867,
    "longitude": -99.20329
  },
  {
    "city": "Amapá",
    "latitude": 1,
    "longitude": -52
  },
  {
    "city": "Amarillo",
    "latitude": 35.2219971,
    "longitude": -101.8312969
  },
  {
    "city": "Amman",
    "latitude": 31.9539,
    "longitude": 35.9106
  },
  {
    "city": "Amman",
    "latitude": 31.95522,
    "longitude": 35.94503
  },
  {
    "city": "Amrāvati",
    "latitude": 20.93333,
    "longitude": 77.75
  },
  {
    "city": "Amritsar",
    "latitude": 31.62234,
    "longitude": 74.87534
  },
  {
    "city": "Amsterdam",
    "latitude": 52.3676,
    "longitude": 4.9041
  },
  {
    "city": "Amsterdam",
    "latitude": 52.37403,
    "longitude": 4.88969
  },
  {
    "city": "Anaheim",
    "latitude": 33.8352932,
    "longitude": -117.9145036
  },
  {
    "city": "Anchorage",
    "latitude": 61.2180556,
    "longitude": -149.9002778
  },
  {
    "city": "Anderson",
    "latitude": 40.1053196,
    "longitude": -85.6802541
  },
  {
    "city": "Ankara",
    "latitude": 39.9334,
    "longitude": 32.8597
  },
  {
    "city": "Ankara",
    "latitude": 39.92063,
    "longitude": 32.85403
  },
  {
    "city": "Ankara",
    "latitude": 39.91987,
    "longitude": 32.85427
  },
  {
    "city": "Ann Arbor",
    "latitude": 42.2808,
    "longitude": -83.743
  },
  {
    "city": "Annapolis",
    "latitude": 38.9784453,
    "longitude": -76.4921829
  },
  {
    "city": "Ansan-si",
    "latitude": 37.32361,
    "longitude": 126.82194
  },
  {
    "city": "Anseba Region",
    "latitude": 16.5,
    "longitude": 37.5
  },
  {
    "city": "Anshan",
    "latitude": 41.12361,
    "longitude": 122.99
  },
  {
    "city": "Antalya",
    "latitude": 36.8969,
    "longitude": 30.7133
  },
  {
    "city": "Antalya",
    "latitude": 36.76984,
    "longitude": 31.90215
  },
  {
    "city": "Antalya",
    "latitude": 36.90812,
    "longitude": 30.69556
  },
  {
    "city": "Antananarivo",
    "latitude": -18.8792,
    "longitude": 47.5079
  },
  {
    "city": "Antananarivo",
    "latitude": -18.91368,
    "longitude": 47.53613
  },
  {
    "city": "Antwerp",
    "latitude": 51.2194,
    "longitude": 4.4025
  },
  {
    "city": "Anyang",
    "latitude": 36.096,
    "longitude": 114.38278
  },
  {
    "city": "Anyang-si",
    "latitude": 37.3925,
    "longitude": 126.92694
  },
  {
    "city": "Appleton",
    "latitude": 44.2619309,
    "longitude": -88.41538469999999
  },
  {
    "city": "Arab Republic of Egypt",
    "latitude": 27,
    "longitude": 30
  },
  {
    "city": "Aragon",
    "latitude": 41.5,
    "longitude": -0.66667
  },
  {
    "city": "Arequipa",
    "latitude": -16.39889,
    "longitude": -71.535
  },
  {
    "city": "Arlington",
    "latitude": 32.7357,
    "longitude": -97.1081
  },
  {
    "city": "Arvada",
    "latitude": 39.83,
    "longitude": -105.15
  },
  {
    "city": "As Sulaymānīyah",
    "latitude": 35.56496,
    "longitude": 45.4329
  },
  {
    "city": "Ashanti Region",
    "latitude": 6.75,
    "longitude": -1.5
  },
  {
    "city": "Asheville",
    "latitude": 35.5950581,
    "longitude": -82.5514869
  },
  {
    "city": "Ashgabat",
    "latitude": 37.9601,
    "longitude": 58.3261
  },
  {
    "city": "Ashgabat",
    "latitude": 37.95,
    "longitude": 58.38333
  },
  {
    "city": "Asmara",
    "latitude": 15.33805,
    "longitude": 38.93184
  },
  {
    "city": "Asunción",
    "latitude": -25.2637,
    "longitude": -57.5759
  },
  {
    "city": "Asunción",
    "latitude": -25.30066,
    "longitude": -57.63591
  },
  {
    "city": "Athens",
    "latitude": 37.97945,
    "longitude": 23.71622
  },
  {
    "city": "Athens-Clarke County",
    "latitude": 33.9519347,
    "longitude": -83.357567
  },
  {
    "city": "Atlanta",
    "latitude": 33.7489954,
    "longitude": -84.3879824
  },
  {
    "city": "Atlantic City",
    "latitude": 39.3642834,
    "longitude": -74.4229266
  },
  {
    "city": "Attleboro",
    "latitude": 41.94454409999999,
    "longitude": -71.2856082
  },
  {
    "city": "Auckland",
    "latitude": -36.8485,
    "longitude": 174.7633
  },
  {
    "city": "Augusta-Richmond",
    "latitude": 33.4734978,
    "longitude": -82.0105148
  },
  {
    "city": "Augusta-Richmond County",
    "latitude": 33.4734978,
    "longitude": -82.0105148
  },
  {
    "city": "Aurangabad",
    "latitude": 19.87757,
    "longitude": 75.34226
  },
  {
    "city": "Aurora",
    "latitude": 39.7294,
    "longitude": -104.8319
  },
  {
    "city": "Austin",
    "latitude": 30.267153,
    "longitude": -97.7430608
  },
  {
    "city": "Aydın",
    "latitude": 37.75,
    "longitude": 28
  },
  {
    "city": "Bağcılar",
    "latitude": 41.03903,
    "longitude": 28.85671
  },
  {
    "city": "Baghdad",
    "latitude": 33.3128,
    "longitude": 44.3615
  },
  {
    "city": "Baghdad",
    "latitude": 33.34058,
    "longitude": 44.40088
  },
  {
    "city": "Bahçelievler",
    "latitude": 41.00231,
    "longitude": 28.8598
  },
  {
    "city": "Bakersfield",
    "latitude": 35.3732921,
    "longitude": -119.0187125
  },
  {
    "city": "Baku",
    "latitude": 40.4093,
    "longitude": 49.8671
  },
  {
    "city": "Baku",
    "latitude": 40.37767,
    "longitude": 49.89201
  },
  {
    "city": "Balıkesir",
    "latitude": 39.75,
    "longitude": 28
  },
  {
    "city": "Baltimore",
    "latitude": 39.2903848,
    "longitude": -76.6121893
  },
  {
    "city": "Bamako",
    "latitude": 12.6392,
    "longitude": -8.0029
  },
  {
    "city": "Bamako",
    "latitude": 12.65,
    "longitude": -8
  },
  {
    "city": "Banan Qu",
    "latitude": 29.37079,
    "longitude": 106.73456
  },
  {
    "city": "Bandar Lampung",
    "latitude": -5.42917,
    "longitude": 105.26111
  },
  {
    "city": "Bandung",
    "latitude": -6.92222,
    "longitude": 107.60694
  },
  {
    "city": "Bangkok",
    "latitude": 13.7563,
    "longitude": 100.5018
  },
  {
    "city": "Bangkok",
    "latitude": 13.75398,
    "longitude": 100.50144
  },
  {
    "city": "Banjarmasin",
    "latitude": -3.31987,
    "longitude": 114.59075
  },
  {
    "city": "Banska Bystrica",
    "latitude": 48.5,
    "longitude": 19.5
  },
  {
    "city": "Baoding",
    "latitude": 38.85111,
    "longitude": 115.49028
  },
  {
    "city": "Baotou",
    "latitude": 40.65222,
    "longitude": 109.82222
  },
  {
    "city": "Barcelona",
    "latitude": 41.38879,
    "longitude": 2.15899
  },
  {
    "city": "Barcelona",
    "latitude": 41.39942,
    "longitude": 2.12804
  },
  {
    "city": "Bareilly",
    "latitude": 28.36678,
    "longitude": 79.43167
  },
  {
    "city": "Bari",
    "latitude": 40.93333,
    "longitude": 16.66667
  },
  {
    "city": "Barnaul",
    "latitude": 53.36056,
    "longitude": 83.76361
  },
  {
    "city": "Barnstable Town",
    "latitude": 41.7003208,
    "longitude": -70.3002024
  },
  {
    "city": "Barquisimeto",
    "latitude": 10.0647,
    "longitude": -69.35703
  },
  {
    "city": "Barranquilla",
    "latitude": 10.9878,
    "longitude": -74.7889
  },
  {
    "city": "Barranquilla",
    "latitude": 10.96854,
    "longitude": -74.78132
  },
  {
    "city": "Basilicata",
    "latitude": 40.5041,
    "longitude": 16.11396
  },
  {
    "city": "Basrah",
    "latitude": 30.50852,
    "longitude": 47.7804
  },
  {
    "city": "Baton Rouge",
    "latitude": 30.4582829,
    "longitude": -91.1403196
  },
  {
    "city": "Battagram",
    "latitude": 34.67719,
    "longitude": 73.02329
  },
  {
    "city": "Bauchi State",
    "latitude": 10.5,
    "longitude": 10
  },
  {
    "city": "Beaumont",
    "latitude": 30.080174,
    "longitude": -94.1265562
  },
  {
    "city": "Bedfordshire",
    "latitude": 52,
    "longitude": -0.5
  },
  {
    "city": "Beheira Governorate",
    "latitude": 30.6,
    "longitude": 30.2
  },
  {
    "city": "Beijing",
    "latitude": 39.9042,
    "longitude": 116.4074
  },
  {
    "city": "Beijing",
    "latitude": 39.9075,
    "longitude": 116.39723
  },
  {
    "city": "Beirut",
    "latitude": 33.8938,
    "longitude": 35.5018
  },
  {
    "city": "Beirut",
    "latitude": 33.89332,
    "longitude": 35.50157
  },
  {
    "city": "Bekasi",
    "latitude": -6.2349,
    "longitude": 106.9896
  },
  {
    "city": "Belém",
    "latitude": -1.45583,
    "longitude": -48.50444
  },
  {
    "city": "Belfast",
    "latitude": 54.5973,
    "longitude": -5.9301
  },
  {
    "city": "Belgrade",
    "latitude": 44.80401,
    "longitude": 20.46513
  },
  {
    "city": "Belleville",
    "latitude": 38.5200504,
    "longitude": -89.9839935
  },
  {
    "city": "Bellingham",
    "latitude": 48.74908,
    "longitude": -122.4781473
  },
  {
    "city": "Belo Horizonte",
    "latitude": -19.9167,
    "longitude": -43.9345
  },
  {
    "city": "Belo Horizonte",
    "latitude": -19.92083,
    "longitude": -43.93778
  },
  {
    "city": "Beloit",
    "latitude": 42.5083482,
    "longitude": -89.03177649999999
  },
  {
    "city": "Bend",
    "latitude": 44.0581728,
    "longitude": -121.3153096
  },
  {
    "city": "Bengaluru",
    "latitude": 12.97194,
    "longitude": 77.59369
  },
  {
    "city": "Bengbu",
    "latitude": 32.94083,
    "longitude": 117.36083
  },
  {
    "city": "Benghazi",
    "latitude": 32.11486,
    "longitude": 20.06859
  },
  {
    "city": "Benin City",
    "latitude": 6.33815,
    "longitude": 5.62575
  },
  {
    "city": "Benoni",
    "latitude": -26.18848,
    "longitude": 28.32078
  },
  {
    "city": "Benue State",
    "latitude": 7.33333,
    "longitude": 8.75
  },
  {
    "city": "Benxi",
    "latitude": 41.28861,
    "longitude": 123.765
  },
  {
    "city": "Berkeley",
    "latitude": 37.87,
    "longitude": -122.27
  },
  {
    "city": "Berkshire",
    "latitude": 51.5,
    "longitude": -1.25
  },
  {
    "city": "Berlin",
    "latitude": 52.52,
    "longitude": 13.405
  },
  {
    "city": "Berlin",
    "latitude": 52.52437,
    "longitude": 13.41053
  },
  {
    "city": "Beverly",
    "latitude": 42.5584283,
    "longitude": -70.880049
  },
  {
    "city": "Bhilai",
    "latitude": 21.20919,
    "longitude": 81.4285
  },
  {
    "city": "Bhiwandi",
    "latitude": 19.30023,
    "longitude": 73.05881
  },
  {
    "city": "Bhopal",
    "latitude": 23.25469,
    "longitude": 77.40289
  },
  {
    "city": "Bhubaneshwar",
    "latitude": 20.27241,
    "longitude": 85.83385
  },
  {
    "city": "Bīkaner",
    "latitude": 28.01762,
    "longitude": 73.31495
  },
  {
    "city": "Billings",
    "latitude": 45.7832856,
    "longitude": -108.5006904
  },
  {
    "city": "Biloxi",
    "latitude": 30.3960318,
    "longitude": -88.88530779999999
  },
  {
    "city": "Binghamton",
    "latitude": 42.09868669999999,
    "longitude": -75.91797380000001
  },
  {
    "city": "Birmingham",
    "latitude": 33.5206608,
    "longitude": -86.80248999999999
  },
  {
    "city": "Birmingham",
    "latitude": 52.4862,
    "longitude": -1.8904
  },
  {
    "city": "Birmingham",
    "latitude": 52.48142,
    "longitude": -1.89983
  },
  {
    "city": "Bishkek",
    "latitude": 42.8746,
    "longitude": 74.5698
  },
  {
    "city": "Bishkek",
    "latitude": 42.87,
    "longitude": 74.59
  },
  {
    "city": "Bismarck",
    "latitude": 46.8083268,
    "longitude": -100.7837392
  },
  {
    "city": "Blantyre",
    "latitude": -15.78499,
    "longitude": 35.00854
  },
  {
    "city": "Bloomington",
    "latitude": 39.165325,
    "longitude": -86.52638569999999
  },
  {
    "city": "Bloomington",
    "latitude": 40.4842027,
    "longitude": -88.99368729999999
  },
  {
    "city": "Boca Raton",
    "latitude": 26.3683064,
    "longitude": -80.1289321
  },
  {
    "city": "Bogor",
    "latitude": -6.59444,
    "longitude": 106.78917
  },
  {
    "city": "Bogotá",
    "latitude": 4.711,
    "longitude": -74.0721
  },
  {
    "city": "Bogotá",
    "latitude": 4.60971,
    "longitude": -74.08175
  },
  {
    "city": "Boise City",
    "latitude": 43.6187102,
    "longitude": -116.2146068
  },
  {
    "city": "Bologna",
    "latitude": 44.46667,
    "longitude": 11.43333
  },
  {
    "city": "Borivli",
    "latitude": 19.23496,
    "longitude": 72.85976
  },
  {
    "city": "Borno State",
    "latitude": 11.5,
    "longitude": 13
  },
  {
    "city": "Boston",
    "latitude": 42.3600825,
    "longitude": -71.0588801
  },
  {
    "city": "Bouaké",
    "latitude": 7.69385,
    "longitude": -5.03031
  },
  {
    "city": "Boulder",
    "latitude": 40.02,
    "longitude": -105.25
  },
  {
    "city": "Boumerdas",
    "latitude": 36.76639,
    "longitude": 3.47717
  },
  {
    "city": "Bowie",
    "latitude": 39.0067768,
    "longitude": -76.77913649999999
  },
  {
    "city": "Bowling Green",
    "latitude": 36.9685219,
    "longitude": -86.4808043
  },
  {
    "city": "Bozeman",
    "latitude": 45.6769979,
    "longitude": -111.0429339
  },
  {
    "city": "Brasília",
    "latitude": -15.8267,
    "longitude": -47.9218
  },
  {
    "city": "Brasília",
    "latitude": -15.77972,
    "longitude": -47.92972
  },
  {
    "city": "Bratislava",
    "latitude": 48.33333,
    "longitude": 17.16667
  },
  {
    "city": "Brazzaville",
    "latitude": -4.2634,
    "longitude": 15.2429
  },
  {
    "city": "Brazzaville",
    "latitude": -4.26613,
    "longitude": 15.28318
  },
  {
    "city": "Bridgeport",
    "latitude": 41.1865478,
    "longitude": -73.19517669999999
  },
  {
    "city": "Bridgetown",
    "latitude": 13.0975,
    "longitude": -59.6167
  },
  {
    "city": "Brisbane",
    "latitude": -27.4698,
    "longitude": 153.0251
  },
  {
    "city": "Brisbane",
    "latitude": -27.46794,
    "longitude": 153.02809
  },
  {
    "city": "Bristol",
    "latitude": 51.4545,
    "longitude": -2.5879
  },
  {
    "city": "Bristol",
    "latitude": 51.45523,
    "longitude": -2.59665
  },
  {
    "city": "Brockton",
    "latitude": 42.0834335,
    "longitude": -71.0183787
  },
  {
    "city": "Broken Arrow",
    "latitude": 36.04,
    "longitude": -95.78
  },
  {
    "city": "Brookfield",
    "latitude": 43.0605671,
    "longitude": -88.1064787
  },
  {
    "city": "Brownsville",
    "latitude": 25.9017472,
    "longitude": -97.4974838
  },
  {
    "city": "Brussels",
    "latitude": 50.8503,
    "longitude": 4.3517
  },
  {
    "city": "Brussels",
    "latitude": 50.85045,
    "longitude": 4.34878
  },
  {
    "city": "Bucaramanga",
    "latitude": 7.12539,
    "longitude": -73.1198
  },
  {
    "city": "Bucharest",
    "latitude": 44.43225,
    "longitude": 26.10626
  },
  {
    "city": "Bucheon-si",
    "latitude": 37.49889,
    "longitude": 126.78306
  },
  {
    "city": "Budapest",
    "latitude": 47.4979,
    "longitude": 19.0402
  },
  {
    "city": "Budapest",
    "latitude": 47.49801,
    "longitude": 19.03991
  },
  {
    "city": "Budta",
    "latitude": 7.20417,
    "longitude": 124.43972
  },
  {
    "city": "Buenos Aires",
    "latitude": -34.6037,
    "longitude": -58.3816
  },
  {
    "city": "Buenos Aires",
    "latitude": -34.61315,
    "longitude": -58.37723
  },
  {
    "city": "Buffalo",
    "latitude": 42.88644679999999,
    "longitude": -78.8783689
  },
  {
    "city": "Bujumbura",
    "latitude": -3.3614,
    "longitude": 29.3599
  },
  {
    "city": "Bujumbura Mairie Province",
    "latitude": -3.3802,
    "longitude": 29.3547
  },
  {
    "city": "Bulawayo",
    "latitude": -20.15,
    "longitude": 28.58333
  },
  {
    "city": "Burbank",
    "latitude": 34.19,
    "longitude": -118.33
  },
  {
    "city": "Burlington",
    "latitude": 44.4759,
    "longitude": -73.2121
  },
  {
    "city": "Burlington",
    "latitude": 44.4758825,
    "longitude": -73.21207199999999
  },
  {
    "city": "Bursa",
    "latitude": 40.195,
    "longitude": 29.06
  },
  {
    "city": "Bursa",
    "latitude": 40.19559,
    "longitude": 29.06013
  },
  {
    "city": "Busan",
    "latitude": 35.10278,
    "longitude": 129.04028
  },
  {
    "city": "Cairo",
    "latitude": 30.0444,
    "longitude": 31.2357
  },
  {
    "city": "Cairo",
    "latitude": 30.06263,
    "longitude": 31.24967
  },
  {
    "city": "Cairo Governorate",
    "latitude": 30.05,
    "longitude": 31.65
  },
  {
    "city": "Caldwell",
    "latitude": 43.66293839999999,
    "longitude": -116.6873596
  },
  {
    "city": "Calgary",
    "latitude": 51.0447,
    "longitude": -114.0719
  },
  {
    "city": "Calgary",
    "latitude": 51.05011,
    "longitude": -114.08529
  },
  {
    "city": "Cali",
    "latitude": 3.4516,
    "longitude": -76.532
  },
  {
    "city": "Cali",
    "latitude": 3.43722,
    "longitude": -76.5225
  },
  {
    "city": "Callao",
    "latitude": -12.05659,
    "longitude": -77.11814
  },
  {
    "city": "Caloocan City",
    "latitude": 14.64953,
    "longitude": 120.96788
  },
  {
    "city": "Camayenne",
    "latitude": 9.535,
    "longitude": -13.68778
  },
  {
    "city": "Cambridge",
    "latitude": 42.3736158,
    "longitude": -71.10973349999999
  },
  {
    "city": "Cambridgeshire",
    "latitude": 52.33333,
    "longitude": 0.08333
  },
  {
    "city": "Camden",
    "latitude": 39.9259463,
    "longitude": -75.1196199
  },
  {
    "city": "Campania",
    "latitude": 40.91056,
    "longitude": 14.92053
  },
  {
    "city": "Campinas",
    "latitude": -22.90556,
    "longitude": -47.06083
  },
  {
    "city": "Campo Grande",
    "latitude": -20.44278,
    "longitude": -54.64639
  },
  {
    "city": "Can Tho",
    "latitude": 10.0452,
    "longitude": 105.7469
  },
  {
    "city": "Canada",
    "latitude": 60.10867,
    "longitude": -113.64258
  },
  {
    "city": "Canberra",
    "latitude": -35.2809,
    "longitude": 149.13
  },
  {
    "city": "Çankaya",
    "latitude": 39.9179,
    "longitude": 32.86268
  },
  {
    "city": "Cantabria",
    "latitude": 43.2,
    "longitude": -4.03333
  },
  {
    "city": "Canton",
    "latitude": 40.79894729999999,
    "longitude": -81.378447
  },
  {
    "city": "Cape Coral",
    "latitude": 26.5628537,
    "longitude": -81.9495331
  },
  {
    "city": "Cape Girardeau",
    "latitude": 37.3058839,
    "longitude": -89.51814759999999
  },
  {
    "city": "Cape Town",
    "latitude": -33.9249,
    "longitude": 18.4241
  },
  {
    "city": "Cape Town",
    "latitude": -33.92584,
    "longitude": 18.42322
  },
  {
    "city": "Caracas",
    "latitude": 10.4806,
    "longitude": -66.9036
  },
  {
    "city": "Caracas",
    "latitude": 10.48801,
    "longitude": -66.87919
  },
  {
    "city": "Carmel",
    "latitude": 39.978371,
    "longitude": -86.1180435
  },
  {
    "city": "Carrollton",
    "latitude": 32.9756,
    "longitude": -96.8899
  },
  {
    "city": "Carson City",
    "latitude": 39.1637984,
    "longitude": -119.7674034
  },
  {
    "city": "Cartagena",
    "latitude": 10.39972,
    "longitude": -75.51444
  },
  {
    "city": "Cary",
    "latitude": 35.7915,
    "longitude": -78.7811
  },
  {
    "city": "Casablanca",
    "latitude": 33.5731,
    "longitude": -7.5898
  },
  {
    "city": "Casablanca",
    "latitude": 33.58831,
    "longitude": -7.61138
  },
  {
    "city": "Casper",
    "latitude": 42.866632,
    "longitude": -106.313081
  },
  {
    "city": "Castilla y León",
    "latitude": 41.66667,
    "longitude": -4.25
  },
  {
    "city": "Catalunya",
    "latitude": 41.82046,
    "longitude": 1.86768
  },
  {
    "city": "Cebu City",
    "latitude": 10.31672,
    "longitude": 123.89071
  },
  {
    "city": "Cedar Rapids",
    "latitude": 41.9778795,
    "longitude": -91.6656232
  },
  {
    "city": "Centennial",
    "latitude": 39.59,
    "longitude": -104.87
  },
  {
    "city": "Central Equatoria State",
    "latitude": 4.75,
    "longitude": 31
  },
  {
    "city": "Central Highlands",
    "latitude": 13.67801,
    "longitude": 108.12744
  },
  {
    "city": "Champaign",
    "latitude": 40.1164204,
    "longitude": -88.2433829
  },
  {
    "city": "Champasak",
    "latitude": 14.75,
    "longitude": 106
  },
  {
    "city": "Chandigarh",
    "latitude": 30.73629,
    "longitude": 76.7884
  },
  {
    "city": "Chandler",
    "latitude": 33.3062,
    "longitude": -111.8413
  },
  {
    "city": "Changchun",
    "latitude": 43.88,
    "longitude": 125.32278
  },
  {
    "city": "Changsha",
    "latitude": 28.2282,
    "longitude": 112.9388
  },
  {
    "city": "Changsha",
    "latitude": 28.19874,
    "longitude": 112.97087
  },
  {
    "city": "Changshu City",
    "latitude": 31.64615,
    "longitude": 120.74221
  },
  {
    "city": "Changzhi",
    "latitude": 35.20889,
    "longitude": 111.73861
  },
  {
    "city": "Changzhou",
    "latitude": 31.77359,
    "longitude": 119.95401
  },
  {
    "city": "Charleston",
    "latitude": 38.3498,
    "longitude": -81.6326
  },
  {
    "city": "Charleston",
    "latitude": 32.7764749,
    "longitude": -79.93105120000001
  },
  {
    "city": "Charleston",
    "latitude": 38.3498195,
    "longitude": -81.6326234
  },
  {
    "city": "Charlotte",
    "latitude": 35.2270869,
    "longitude": -80.8431267
  },
  {
    "city": "Charlottesville",
    "latitude": 38.0293059,
    "longitude": -78.47667810000002
  },
  {
    "city": "Chattanooga",
    "latitude": 35.0456297,
    "longitude": -85.3096801
  },
  {
    "city": "Chelsea",
    "latitude": 42.3917638,
    "longitude": -71.0328284
  },
  {
    "city": "Chelyabinsk",
    "latitude": 55.15402,
    "longitude": 61.42915
  },
  {
    "city": "Chelyabinskaya Oblast’",
    "latitude": 54,
    "longitude": 60.5
  },
  {
    "city": "Chengdu",
    "latitude": 30.5728,
    "longitude": 104.0668
  },
  {
    "city": "Chengdu",
    "latitude": 30.66667,
    "longitude": 104.06667
  },
  {
    "city": "Chennai",
    "latitude": 13.08784,
    "longitude": 80.27847
  },
  {
    "city": "Cheongju-si",
    "latitude": 36.63722,
    "longitude": 127.48972
  },
  {
    "city": "Chesapeake",
    "latitude": 36.7682,
    "longitude": -76.2875
  },
  {
    "city": "Cheyenne",
    "latitude": 41.14,
    "longitude": -104.8202
  },
  {
    "city": "Cheyenne",
    "latitude": 41.1399814,
    "longitude": -104.8202462
  },
  {
    "city": "Chiba",
    "latitude": 35.6,
    "longitude": 140.11667
  },
  {
    "city": "Chicago",
    "latitude": 41.8781136,
    "longitude": -87.6297982
  },
  {
    "city": "Chiclayo",
    "latitude": -6.77137,
    "longitude": -79.84088
  },
  {
    "city": "Chico",
    "latitude": 39.7284944,
    "longitude": -121.8374777
  },
  {
    "city": "Chicopee",
    "latitude": 42.1487043,
    "longitude": -72.6078672
  },
  {
    "city": "Chihuahua",
    "latitude": 28.63528,
    "longitude": -106.08889
  },
  {
    "city": "Chisinau",
    "latitude": 47.00556,
    "longitude": 28.8575
  },
  {
    "city": "Chittagong",
    "latitude": 22.3384,
    "longitude": 91.83168
  },
  {
    "city": "Chongqing",
    "latitude": 29.4316,
    "longitude": 106.9123
  },
  {
    "city": "Chongqing",
    "latitude": 29.56278,
    "longitude": 106.55278
  },
  {
    "city": "Christchurch",
    "latitude": -43.5321,
    "longitude": 172.6362
  },
  {
    "city": "Chula Vista",
    "latitude": 32.6401,
    "longitude": -117.0842
  },
  {
    "city": "Cincinnati",
    "latitude": 39.1031182,
    "longitude": -84.5120196
  },
  {
    "city": "Città metropolitana di Milano",
    "latitude": 45.45186,
    "longitude": 9.14586
  },
  {
    "city": "City and Borough of Birmingham",
    "latitude": 52.48048,
    "longitude": -1.89823
  },
  {
    "city": "City and Borough of Leeds",
    "latitude": 53.79644,
    "longitude": -1.5477
  },
  {
    "city": "City of Balikpapan",
    "latitude": -1.24204,
    "longitude": 116.89419
  },
  {
    "city": "Ciudad Guayana",
    "latitude": 8.35122,
    "longitude": -62.64102
  },
  {
    "city": "Ciudad Nezahualcoyotl",
    "latitude": 19.40061,
    "longitude": -99.01483
  },
  {
    "city": "Clarksville",
    "latitude": 36.5297706,
    "longitude": -87.3594528
  },
  {
    "city": "Clearwater",
    "latitude": 27.9659,
    "longitude": -82.8001
  },
  {
    "city": "Cleveland",
    "latitude": 41.49932,
    "longitude": -81.6943605
  },
  {
    "city": "Clinton",
    "latitude": 42.59,
    "longitude": -82.92
  },
  {
    "city": "Clovis",
    "latitude": 36.83,
    "longitude": -119.68
  },
  {
    "city": "Clovis",
    "latitude": 34.4047987,
    "longitude": -103.2052272
  },
  {
    "city": "Cochabamba",
    "latitude": -17.3895,
    "longitude": -66.1568
  },
  {
    "city": "Cochin",
    "latitude": 9.93988,
    "longitude": 76.26022
  },
  {
    "city": "Coeur d'Alene",
    "latitude": 47.6776832,
    "longitude": -116.7804664
  },
  {
    "city": "Coimbatore",
    "latitude": 11.00555,
    "longitude": 76.96612
  },
  {
    "city": "College Station",
    "latitude": 30.627977,
    "longitude": -96.3344068
  },
  {
    "city": "Colombo",
    "latitude": 6.93194,
    "longitude": 79.84778
  },
  {
    "city": "Colorado Springs",
    "latitude": 38.8338816,
    "longitude": -104.8213634
  },
  {
    "city": "Columbia",
    "latitude": 34.0007104,
    "longitude": -81.0348144
  },
  {
    "city": "Columbia",
    "latitude": 38.9517053,
    "longitude": -92.3340724
  },
  {
    "city": "Columbus",
    "latitude": 39.9611755,
    "longitude": -82.99879419999999
  },
  {
    "city": "Columbus",
    "latitude": 32.4609764,
    "longitude": -84.9877094
  },
  {
    "city": "Columbus",
    "latitude": 39.2014404,
    "longitude": -85.9213796
  },
  {
    "city": "Conakry",
    "latitude": 9.53795,
    "longitude": -13.67729
  },
  {
    "city": "Concord",
    "latitude": 37.9775,
    "longitude": -122.0308
  },
  {
    "city": "Concord",
    "latitude": 43.2081366,
    "longitude": -71.5375718
  },
  {
    "city": "Contagem",
    "latitude": -19.93167,
    "longitude": -44.05361
  },
  {
    "city": "Copenhagen",
    "latitude": 55.6761,
    "longitude": 12.5683
  },
  {
    "city": "Copenhagen",
    "latitude": 55.67594,
    "longitude": 12.56553
  },
  {
    "city": "Coral Springs",
    "latitude": 26.2712,
    "longitude": -80.2706
  },
  {
    "city": "Córdoba",
    "latitude": -31.4135,
    "longitude": -64.18105
  },
  {
    "city": "Cork",
    "latitude": 51.8985,
    "longitude": -8.4756
  },
  {
    "city": "Corner Brook",
    "latitude": 48.9489967,
    "longitude": -57.9502726
  },
  {
    "city": "Corona",
    "latitude": 33.8753,
    "longitude": -117.5664
  },
  {
    "city": "Corpus Christi",
    "latitude": 27.8005828,
    "longitude": -97.39638099999999
  },
  {
    "city": "Costa Mesa",
    "latitude": 33.67,
    "longitude": -117.91
  },
  {
    "city": "Cotonou",
    "latitude": 6.36536,
    "longitude": 2.41833
  },
  {
    "city": "Council Bluffs",
    "latitude": 41.2619444,
    "longitude": -95.8608333
  },
  {
    "city": "County Antrim",
    "latitude": 55,
    "longitude": -6.16667
  },
  {
    "city": "County of Cheshire",
    "latitude": 53.16667,
    "longitude": -2.58333
  },
  {
    "city": "Covington",
    "latitude": 39.0836712,
    "longitude": -84.5085536
  },
  {
    "city": "Coyoacán",
    "latitude": 19.3467,
    "longitude": -99.16174
  },
  {
    "city": "Cross River State",
    "latitude": 5.75,
    "longitude": 8.5
  },
  {
    "city": "Cuba",
    "latitude": 21.93384,
    "longitude": -78.75425
  },
  {
    "city": "Cúcuta",
    "latitude": 7.89391,
    "longitude": -72.50782
  },
  {
    "city": "Çukurova",
    "latitude": 37,
    "longitude": 36
  },
  {
    "city": "Culiacán",
    "latitude": 24.79032,
    "longitude": -107.38782
  },
  {
    "city": "Curitiba",
    "latitude": -25.4284,
    "longitude": -49.2733
  },
  {
    "city": "Curitiba",
    "latitude": -25.42778,
    "longitude": -49.27306
  },
  {
    "city": "Cuttack",
    "latitude": 20.46497,
    "longitude": 85.87927
  },
  {
    "city": "Cyprus",
    "latitude": 35.00304,
    "longitude": 32.98791
  },
  {
    "city": "Da Nang",
    "latitude": 16.06778,
    "longitude": 108.22083
  },
  {
    "city": "Dadonghai",
    "latitude": 18.22056,
    "longitude": 109.51028
  },
  {
    "city": "Daegu",
    "latitude": 35.87028,
    "longitude": 128.59111
  },
  {
    "city": "Daejeon",
    "latitude": 36.32139,
    "longitude": 127.41972
  },
  {
    "city": "Dakar",
    "latitude": 14.7167,
    "longitude": -17.4677
  },
  {
    "city": "Dakar",
    "latitude": 14.6937,
    "longitude": -17.44406
  },
  {
    "city": "Dalian",
    "latitude": 38.914,
    "longitude": 121.6147
  },
  {
    "city": "Dalian",
    "latitude": 38.91222,
    "longitude": 121.60222
  },
  {
    "city": "Dallas",
    "latitude": 32.7766642,
    "longitude": -96.79698789999999
  },
  {
    "city": "Daly City",
    "latitude": 37.6879,
    "longitude": -122.4702
  },
  {
    "city": "Damascus",
    "latitude": 33.5138,
    "longitude": 36.2765
  },
  {
    "city": "Damascus",
    "latitude": 33.5102,
    "longitude": 36.29128
  },
  {
    "city": "Damietta Governorate",
    "latitude": 31.35,
    "longitude": 31.75
  },
  {
    "city": "Dammam",
    "latitude": 26.43442,
    "longitude": 50.10326
  },
  {
    "city": "Danbury",
    "latitude": 41.394817,
    "longitude": -73.4540111
  },
  {
    "city": "Dandong",
    "latitude": 40.12917,
    "longitude": 124.39472
  },
  {
    "city": "Danville",
    "latitude": 36.5859718,
    "longitude": -79.39502279999999
  },
  {
    "city": "Dar es Salaam",
    "latitude": -6.7924,
    "longitude": 39.2083
  },
  {
    "city": "Dar es Salaam",
    "latitude": -6.82349,
    "longitude": 39.26951
  },
  {
    "city": "Datong",
    "latitude": 40.09361,
    "longitude": 113.29139
  },
  {
    "city": "Davao",
    "latitude": 7.07306,
    "longitude": 125.61278
  },
  {
    "city": "Davao City",
    "latitude": 7.1907,
    "longitude": 125.4553
  },
  {
    "city": "Davenport",
    "latitude": 41.5236437,
    "longitude": -90.5776367
  },
  {
    "city": "Dayton",
    "latitude": 39.7589478,
    "longitude": -84.1916069
  },
  {
    "city": "Dearborn",
    "latitude": 42.31,
    "longitude": -83.21
  },
  {
    "city": "Debub Region",
    "latitude": 14.83333,
    "longitude": 38.83333
  },
  {
    "city": "Decatur",
    "latitude": 39.8403147,
    "longitude": -88.9548001
  },
  {
    "city": "Decatur",
    "latitude": 34.6059253,
    "longitude": -86.9833417
  },
  {
    "city": "Delhi",
    "latitude": 28.7041,
    "longitude": 77.1025
  },
  {
    "city": "Delhi",
    "latitude": 28.65195,
    "longitude": 77.23149
  },
  {
    "city": "Deltona",
    "latitude": 28.9005,
    "longitude": -81.2637
  },
  {
    "city": "Denizli",
    "latitude": 37.84016,
    "longitude": 29.06982
  },
  {
    "city": "Denpasar",
    "latitude": -8.65,
    "longitude": 115.21667
  },
  {
    "city": "Denton",
    "latitude": 33.2148,
    "longitude": -97.1331
  },
  {
    "city": "Denver",
    "latitude": 39.7392358,
    "longitude": -104.990251
  },
  {
    "city": "Departamento de Potosí",
    "latitude": -20.66667,
    "longitude": -67
  },
  {
    "city": "Departamento de Santa Cruz",
    "latitude": -17.5,
    "longitude": -61.5
  },
  {
    "city": "Depok",
    "latitude": -6.4,
    "longitude": 106.81861
  },
  {
    "city": "Des Moines",
    "latitude": 41.6005448,
    "longitude": -93.6091064
  },
  {
    "city": "Detroit",
    "latitude": 42.331427,
    "longitude": -83.0457538
  },
  {
    "city": "Dhaka",
    "latitude": 23.8103,
    "longitude": 90.4125
  },
  {
    "city": "Dhaka",
    "latitude": 23.7104,
    "longitude": 90.40744
  },
  {
    "city": "Distrito Capital",
    "latitude": 10.47639,
    "longitude": -66.98333
  },
  {
    "city": "Distrito de Panamá",
    "latitude": 9.30612,
    "longitude": -79.45246
  },
  {
    "city": "Diyarbakır",
    "latitude": 37.96152,
    "longitude": 40.23193
  },
  {
    "city": "Diyarbakır",
    "latitude": 37.91363,
    "longitude": 40.21721
  },
  {
    "city": "Djibouti",
    "latitude": 11.58901,
    "longitude": 43.14503
  },
  {
    "city": "Dnipro",
    "latitude": 48.4593,
    "longitude": 35.03865
  },
  {
    "city": "Doha",
    "latitude": 25.2854,
    "longitude": 51.531
  },
  {
    "city": "Dombivli",
    "latitude": 19.21667,
    "longitude": 73.08333
  },
  {
    "city": "Donetsk",
    "latitude": 48.023,
    "longitude": 37.80224
  },
  {
    "city": "Dongguan",
    "latitude": 23.01797,
    "longitude": 113.74866
  },
  {
    "city": "Dortmund",
    "latitude": 51.51494,
    "longitude": 7.466
  },
  {
    "city": "Douala",
    "latitude": 4.0511,
    "longitude": 9.7679
  },
  {
    "city": "Douala",
    "latitude": 4.04827,
    "longitude": 9.70428
  },
  {
    "city": "Dover",
    "latitude": 39.158168,
    "longitude": -75.5243682
  },
  {
    "city": "Downey",
    "latitude": 33.94,
    "longitude": -118.13
  },
  {
    "city": "Dubai",
    "latitude": 25.2048,
    "longitude": 55.2708
  },
  {
    "city": "Dubai",
    "latitude": 25.0657,
    "longitude": 55.17128
  },
  {
    "city": "Dublin",
    "latitude": 53.3498,
    "longitude": -6.2603
  },
  {
    "city": "Dublin",
    "latitude": 53.33306,
    "longitude": -6.24889
  },
  {
    "city": "Dubuque",
    "latitude": 42.5005583,
    "longitude": -90.66457179999999
  },
  {
    "city": "Duluth",
    "latitude": 46.78667189999999,
    "longitude": -92.1004852
  },
  {
    "city": "Duque de Caxias",
    "latitude": -22.78556,
    "longitude": -43.31167
  },
  {
    "city": "Durban",
    "latitude": -29.8587,
    "longitude": 31.0218
  },
  {
    "city": "Durban",
    "latitude": -29.8579,
    "longitude": 31.0292
  },
  {
    "city": "Durham",
    "latitude": 35.994,
    "longitude": -78.8986
  },
  {
    "city": "Dushanbe",
    "latitude": 38.53575,
    "longitude": 68.77905
  },
  {
    "city": "Düsseldorf",
    "latitude": 51.22172,
    "longitude": 6.77616
  },
  {
    "city": "Eastern Equatoria",
    "latitude": 4.9,
    "longitude": 33.8
  },
  {
    "city": "Eastern Province",
    "latitude": 8.25,
    "longitude": -11
  },
  {
    "city": "Eau Claire",
    "latitude": 44.811349,
    "longitude": -91.4984941
  },
  {
    "city": "Ecatepec",
    "latitude": 19.60492,
    "longitude": -99.06064
  },
  {
    "city": "Edinburg",
    "latitude": 26.3017374,
    "longitude": -98.1633432
  },
  {
    "city": "Edinburgh",
    "latitude": 55.9533,
    "longitude": -3.1883
  },
  {
    "city": "Edmonton",
    "latitude": 53.5461,
    "longitude": -113.4938
  },
  {
    "city": "Edmonton",
    "latitude": 53.55014,
    "longitude": -113.46871
  },
  {
    "city": "El Cajon",
    "latitude": 32.8,
    "longitude": -116.96
  },
  {
    "city": "El Monte",
    "latitude": 34.07,
    "longitude": -118.03
  },
  {
    "city": "El Paso",
    "latitude": 31.7775757,
    "longitude": -106.4424559
  },
  {
    "city": "Elâzığ",
    "latitude": 38.73695,
    "longitude": 39.17725
  },
  {
    "city": "Elizabeth",
    "latitude": 40.6639916,
    "longitude": -74.2107006
  },
  {
    "city": "Elkhart",
    "latitude": 41.6819935,
    "longitude": -85.9766671
  },
  {
    "city": "Emilia-Romagna",
    "latitude": 44.5444,
    "longitude": 10.98361
  },
  {
    "city": "England",
    "latitude": 52.16045,
    "longitude": -0.70312
  },
  {
    "city": "Enid",
    "latitude": 36.3955891,
    "longitude": -97.8783911
  },
  {
    "city": "Enugu",
    "latitude": 6.44132,
    "longitude": 7.49883
  },
  {
    "city": "Erbil",
    "latitude": 36.18333,
    "longitude": 44.01193
  },
  {
    "city": "Erie",
    "latitude": 42.12922409999999,
    "longitude": -80.085059
  },
  {
    "city": "Erzurum",
    "latitude": 40,
    "longitude": 41.5
  },
  {
    "city": "Escondido",
    "latitude": 33.1192,
    "longitude": -117.0864
  },
  {
    "city": "Eskişehir",
    "latitude": 39.66667,
    "longitude": 31.16667
  },
  {
    "city": "Essen",
    "latitude": 51.45657,
    "longitude": 7.01228
  },
  {
    "city": "Estado Falcón",
    "latitude": 11,
    "longitude": -69.83333
  },
  {
    "city": "Estado Guárico",
    "latitude": 8.66667,
    "longitude": -66.58333
  },
  {
    "city": "Estado Lara",
    "latitude": 10.16667,
    "longitude": -69.83333
  },
  {
    "city": "Eugene",
    "latitude": 44.0520691,
    "longitude": -123.0867536
  },
  {
    "city": "Euskal Autonomia Erkidegoa",
    "latitude": 43,
    "longitude": -2.75
  },
  {
    "city": "Evansville",
    "latitude": 37.9715592,
    "longitude": -87.5710898
  },
  {
    "city": "Everett",
    "latitude": 42.40843,
    "longitude": -71.0536625
  },
  {
    "city": "Fairfield",
    "latitude": 38.2494,
    "longitude": -122.039
  },
  {
    "city": "Faisalābad",
    "latitude": 31.41554,
    "longitude": 73.08969
  },
  {
    "city": "Fall River",
    "latitude": 41.7014912,
    "longitude": -71.1550451
  },
  {
    "city": "Fargo",
    "latitude": 46.8771863,
    "longitude": -96.7898034
  },
  {
    "city": "Faridabad",
    "latitude": 28.41124,
    "longitude": 77.31316
  },
  {
    "city": "Faritanin’ i Toamasina",
    "latitude": -18,
    "longitude": 49
  },
  {
    "city": "Faritanin’ i Toliara",
    "latitude": -21,
    "longitude": 45
  },
  {
    "city": "Farmington",
    "latitude": 36.72805830000001,
    "longitude": -108.2186856
  },
  {
    "city": "Fayetteville",
    "latitude": 35.0526641,
    "longitude": -78.87835849999999
  },
  {
    "city": "Fayetteville",
    "latitude": 36.0625795,
    "longitude": -94.1574263
  },
  {
    "city": "Fes",
    "latitude": 34.0331,
    "longitude": -5.0003
  },
  {
    "city": "Fès",
    "latitude": 34.03313,
    "longitude": -5.00028
  },
  {
    "city": "Findlay",
    "latitude": 41.04422,
    "longitude": -83.6499321
  },
  {
    "city": "Fishers",
    "latitude": 39.9567548,
    "longitude": -86.01335
  },
  {
    "city": "Fitchburg",
    "latitude": 42.5834228,
    "longitude": -71.8022955
  },
  {
    "city": "Flagstaff",
    "latitude": 35.1982836,
    "longitude": -111.651302
  },
  {
    "city": "Flint",
    "latitude": 43.0125274,
    "longitude": -83.6874562
  },
  {
    "city": "Florence",
    "latitude": 34.1954331,
    "longitude": -79.7625625
  },
  {
    "city": "Fond du Lac",
    "latitude": 43.7730448,
    "longitude": -88.4470508
  },
  {
    "city": "Fontana",
    "latitude": 34.0922,
    "longitude": -117.435
  },
  {
    "city": "Fort Collins",
    "latitude": 40.5852602,
    "longitude": -105.084423
  },
  {
    "city": "Fort Lauderdale",
    "latitude": 26.1224386,
    "longitude": -80.13731740000001
  },
  {
    "city": "Fort Smith",
    "latitude": 35.3859242,
    "longitude": -94.39854749999999
  },
  {
    "city": "Fort Wayne",
    "latitude": 41.079273,
    "longitude": -85.1393513
  },
  {
    "city": "Fort Worth",
    "latitude": 32.7554883,
    "longitude": -97.3307658
  },
  {
    "city": "Fortaleza",
    "latitude": -3.7319,
    "longitude": -38.5267
  },
  {
    "city": "Fortaleza",
    "latitude": -3.71722,
    "longitude": -38.54306
  },
  {
    "city": "Foshan",
    "latitude": 23.0215,
    "longitude": 113.1214
  },
  {
    "city": "Foshan",
    "latitude": 23.02677,
    "longitude": 113.13148
  },
  {
    "city": "Frankfurt",
    "latitude": 50.1109,
    "longitude": 8.6821
  },
  {
    "city": "Frankfurt am Main",
    "latitude": 50.11552,
    "longitude": 8.68417
  },
  {
    "city": "Frederick",
    "latitude": 39.41426879999999,
    "longitude": -77.4105409
  },
  {
    "city": "Freetown",
    "latitude": 8.48714,
    "longitude": -13.2356
  },
  {
    "city": "Fremont",
    "latitude": 37.49,
    "longitude": -121.94
  },
  {
    "city": "Fresno",
    "latitude": 36.7468422,
    "longitude": -119.7725868
  },
  {
    "city": "Frisco",
    "latitude": 33.1507,
    "longitude": -96.8236
  },
  {
    "city": "Friuli Venezia Giulia",
    "latitude": 46,
    "longitude": 13
  },
  {
    "city": "Fukuoka",
    "latitude": 33.6,
    "longitude": 130.41667
  },
  {
    "city": "Fullerton",
    "latitude": 33.89,
    "longitude": -117.93
  },
  {
    "city": "Fushun",
    "latitude": 41.88669,
    "longitude": 123.94363
  },
  {
    "city": "Fuxin",
    "latitude": 42.01556,
    "longitude": 121.65889
  },
  {
    "city": "Fuzhou",
    "latitude": 26.06139,
    "longitude": 119.30611
  },
  {
    "city": "Gainesville",
    "latitude": 29.6516344,
    "longitude": -82.32482619999999
  },
  {
    "city": "Gaithersburg",
    "latitude": 39.1434406,
    "longitude": -77.2013705
  },
  {
    "city": "Galicia",
    "latitude": 42.75508,
    "longitude": -7.86621
  },
  {
    "city": "Galveston",
    "latitude": 29.3013479,
    "longitude": -94.7976958
  },
  {
    "city": "Galway",
    "latitude": 53.2707,
    "longitude": -9.0568
  },
  {
    "city": "Gambia",
    "latitude": 13.5,
    "longitude": -15.5
  },
  {
    "city": "Garden Grove",
    "latitude": 33.7739,
    "longitude": -117.9414
  },
  {
    "city": "Garland",
    "latitude": 32.9126,
    "longitude": -96.6389
  },
  {
    "city": "Gary",
    "latitude": 41.5933696,
    "longitude": -87.3464271
  },
  {
    "city": "Gash-Barka Region",
    "latitude": 15.25,
    "longitude": 37.5
  },
  {
    "city": "Gaziantep",
    "latitude": 37.0662,
    "longitude": 37.3833
  },
  {
    "city": "Gaziantep",
    "latitude": 37.08333,
    "longitude": 37.33333
  },
  {
    "city": "Gaziantep",
    "latitude": 37.05944,
    "longitude": 37.3825
  },
  {
    "city": "Gemeente Amsterdam",
    "latitude": 52.37302,
    "longitude": 4.89856
  },
  {
    "city": "General Santos",
    "latitude": 6.11278,
    "longitude": 125.17167
  },
  {
    "city": "Geneva",
    "latitude": 46.2044,
    "longitude": 6.1432
  },
  {
    "city": "Genoa",
    "latitude": 44.41286,
    "longitude": 8.95729
  },
  {
    "city": "Genoa",
    "latitude": 44.40478,
    "longitude": 8.94439
  },
  {
    "city": "Georgetown",
    "latitude": 30.6333,
    "longitude": -97.677
  },
  {
    "city": "Georgetown",
    "latitude": 6.8013,
    "longitude": -58.1551
  },
  {
    "city": "Ghāziābād",
    "latitude": 28.66535,
    "longitude": 77.43915
  },
  {
    "city": "Gilbert",
    "latitude": 33.3528,
    "longitude": -111.789
  },
  {
    "city": "Giza",
    "latitude": 30.00808,
    "longitude": 31.21093
  },
  {
    "city": "Glasgow",
    "latitude": 55.8642,
    "longitude": -4.2518
  },
  {
    "city": "Glasgow",
    "latitude": 55.86515,
    "longitude": -4.25763
  },
  {
    "city": "Glasgow City",
    "latitude": 55.86667,
    "longitude": -4.25
  },
  {
    "city": "Glendale",
    "latitude": 33.5387,
    "longitude": -112.186
  },
  {
    "city": "Gobolka Hiiraan",
    "latitude": 4,
    "longitude": 45.5
  },
  {
    "city": "Gobolka Mudug",
    "latitude": 7,
    "longitude": 48
  },
  {
    "city": "Goiânia",
    "latitude": -16.67861,
    "longitude": -49.25389
  },
  {
    "city": "Gold Coast",
    "latitude": -28.0167,
    "longitude": 153.4
  },
  {
    "city": "Gold Coast",
    "latitude": -28.00029,
    "longitude": 153.43088
  },
  {
    "city": "Golden Horseshoe",
    "latitude": 44.48671,
    "longitude": -79.71405
  },
  {
    "city": "Gorakhpur",
    "latitude": 29.44768,
    "longitude": 75.67206
  },
  {
    "city": "Gorakhpur",
    "latitude": 26.76628,
    "longitude": 83.36889
  },
  {
    "city": "Gorod Bryansk",
    "latitude": 53.25,
    "longitude": 34.41667
  },
  {
    "city": "Gorod Chelyabinsk",
    "latitude": 55.16553,
    "longitude": 61.41673
  },
  {
    "city": "Gorod Kazan’",
    "latitude": 55.75,
    "longitude": 49.13333
  },
  {
    "city": "Göteborg",
    "latitude": 57.70716,
    "longitude": 11.96679
  },
  {
    "city": "Gouvernorat de Bizerte",
    "latitude": 37.08333,
    "longitude": 9.58333
  },
  {
    "city": "Gouvernorat de Kairouan",
    "latitude": 35.58333,
    "longitude": 9.83333
  },
  {
    "city": "Gouvernorat de Nabeul",
    "latitude": 36.66667,
    "longitude": 10.66667
  },
  {
    "city": "Gouvernorat de Sfax",
    "latitude": 34.75,
    "longitude": 10.41667
  },
  {
    "city": "Gouvernorat de Sousse",
    "latitude": 35.91667,
    "longitude": 10.41667
  },
  {
    "city": "Gouvernorat de Tunis",
    "latitude": 36.78633,
    "longitude": 10.18484
  },
  {
    "city": "Goyang-si",
    "latitude": 37.65639,
    "longitude": 126.835
  },
  {
    "city": "Grand Forks",
    "latitude": 47.9252568,
    "longitude": -97.0328547
  },
  {
    "city": "Grand Island",
    "latitude": 40.9263957,
    "longitude": -98.3420118
  },
  {
    "city": "Grand Junction",
    "latitude": 39.0638705,
    "longitude": -108.5506486
  },
  {
    "city": "Grand Prairie",
    "latitude": 32.7459,
    "longitude": -96.9978
  },
  {
    "city": "Grand Rapids",
    "latitude": 42.9633599,
    "longitude": -85.6680863
  },
  {
    "city": "Great Falls",
    "latitude": 47.4941836,
    "longitude": -111.2833449
  },
  {
    "city": "Greater Cairo Area",
    "latitude": 30.01745,
    "longitude": 31.21808
  },
  {
    "city": "Green Bay",
    "latitude": 44.51915899999999,
    "longitude": -88.019826
  },
  {
    "city": "Greenfield",
    "latitude": 42.9614039,
    "longitude": -88.0125865
  },
  {
    "city": "Greensboro",
    "latitude": 36.0726354,
    "longitude": -79.7919754
  },
  {
    "city": "Greenville",
    "latitude": 35.612661,
    "longitude": -77.3663538
  },
  {
    "city": "Greenville",
    "latitude": 34.85261759999999,
    "longitude": -82.3940104
  },
  {
    "city": "Greenwood",
    "latitude": 39.6136578,
    "longitude": -86.10665259999999
  },
  {
    "city": "Guadalajara",
    "latitude": 20.66682,
    "longitude": -103.39182
  },
  {
    "city": "Guadalupe",
    "latitude": 25.67678,
    "longitude": -100.25646
  },
  {
    "city": "Guangzhou",
    "latitude": 23.11667,
    "longitude": 113.25
  },
  {
    "city": "Guankou",
    "latitude": 28.15861,
    "longitude": 113.62709
  },
  {
    "city": "Guarulhos",
    "latitude": -23.46278,
    "longitude": -46.53333
  },
  {
    "city": "Guatemala City",
    "latitude": 14.64072,
    "longitude": -90.51327
  },
  {
    "city": "Guayaquil",
    "latitude": -2.1709,
    "longitude": -79.9224
  },
  {
    "city": "Guayaquil",
    "latitude": -2.20584,
    "longitude": -79.90795
  },
  {
    "city": "Guilin",
    "latitude": 25.28194,
    "longitude": 110.28639
  },
  {
    "city": "Guiyang",
    "latitude": 26.58333,
    "longitude": 106.71667
  },
  {
    "city": "Gujrānwāla",
    "latitude": 32.15567,
    "longitude": 74.18705
  },
  {
    "city": "Gulfport",
    "latitude": 30.3674198,
    "longitude": -89.0928155
  },
  {
    "city": "Gustavo Adolfo Madero",
    "latitude": 19.49392,
    "longitude": -99.11075
  },
  {
    "city": "Guwahati",
    "latitude": 26.1844,
    "longitude": 91.7458
  },
  {
    "city": "Gwalior",
    "latitude": 26.22983,
    "longitude": 78.17337
  },
  {
    "city": "Gwangju",
    "latitude": 35.15472,
    "longitude": 126.91556
  },
  {
    "city": "Hachiōji",
    "latitude": 35.65583,
    "longitude": 139.32389
  },
  {
    "city": "Hagerstown",
    "latitude": 39.6417629,
    "longitude": -77.71999319999999
  },
  {
    "city": "Haikou",
    "latitude": 20.04583,
    "longitude": 110.34167
  },
  {
    "city": "Haiphong",
    "latitude": 20.86481,
    "longitude": 106.68345
  },
  {
    "city": "Hamamatsu",
    "latitude": 34.7,
    "longitude": 137.73333
  },
  {
    "city": "Hamburg",
    "latitude": 53.5511,
    "longitude": 9.9937
  },
  {
    "city": "Hamburg",
    "latitude": 53.57532,
    "longitude": 10.01534
  },
  {
    "city": "Hamilton",
    "latitude": -37.787,
    "longitude": 175.2793
  },
  {
    "city": "Hammond",
    "latitude": 41.5833688,
    "longitude": -87.5000412
  },
  {
    "city": "Hampton",
    "latitude": 37.0299,
    "longitude": -76.3452
  },
  {
    "city": "Handan",
    "latitude": 36.60056,
    "longitude": 114.46778
  },
  {
    "city": "Hangzhou",
    "latitude": 30.2741,
    "longitude": 120.1551
  },
  {
    "city": "Hangzhou",
    "latitude": 30.29365,
    "longitude": 120.16142
  },
  {
    "city": "Hanoi",
    "latitude": 21.0278,
    "longitude": 105.8342
  },
  {
    "city": "Hanoi",
    "latitude": 21.0245,
    "longitude": 105.84117
  },
  {
    "city": "Hāora",
    "latitude": 22.57688,
    "longitude": 88.31857
  },
  {
    "city": "Harare",
    "latitude": -17.82772,
    "longitude": 31.05337
  },
  {
    "city": "Harbin",
    "latitude": 45.8038,
    "longitude": 126.5349
  },
  {
    "city": "Harbin",
    "latitude": 45.75,
    "longitude": 126.65
  },
  {
    "city": "Harrisburg",
    "latitude": 40.2731911,
    "longitude": -76.8867008
  },
  {
    "city": "Harrisonburg",
    "latitude": 38.4495688,
    "longitude": -78.8689155
  },
  {
    "city": "Hartford",
    "latitude": 41.76371109999999,
    "longitude": -72.6850932
  },
  {
    "city": "Hatay",
    "latitude": 36.5,
    "longitude": 36.25
  },
  {
    "city": "Hattiesburg",
    "latitude": 31.3271189,
    "longitude": -89.29033919999999
  },
  {
    "city": "Havana",
    "latitude": 23.13302,
    "longitude": -82.38304
  },
  {
    "city": "Haverhill",
    "latitude": 42.7762015,
    "longitude": -71.0772796
  },
  {
    "city": "Hayward",
    "latitude": 37.6688,
    "longitude": -122.0808
  },
  {
    "city": "Hefei",
    "latitude": 31.86389,
    "longitude": 117.28083
  },
  {
    "city": "Hegang",
    "latitude": 47.35118,
    "longitude": 130.30012
  },
  {
    "city": "Helsinki",
    "latitude": 60.1699,
    "longitude": 24.9384
  },
  {
    "city": "Henderson",
    "latitude": 36.0395,
    "longitude": -114.9817
  },
  {
    "city": "Hengyang",
    "latitude": 26.88946,
    "longitude": 112.61888
  },
  {
    "city": "Hermosillo",
    "latitude": 29.1026,
    "longitude": -110.97732
  },
  {
    "city": "Hesperia",
    "latitude": 34.4,
    "longitude": -117.32
  },
  {
    "city": "Hialeah",
    "latitude": 25.8576,
    "longitude": -80.2781
  },
  {
    "city": "Hickory",
    "latitude": 35.7344538,
    "longitude": -81.3444573
  },
  {
    "city": "High Point",
    "latitude": 35.9557,
    "longitude": -80.0053
  },
  {
    "city": "Highlands Ranch",
    "latitude": 39.54,
    "longitude": -104.97
  },
  {
    "city": "Hilo",
    "latitude": 19.724112,
    "longitude": -155.086823
  },
  {
    "city": "Hilton Head Island",
    "latitude": 32.216316,
    "longitude": -80.752608
  },
  {
    "city": "Hiroshima",
    "latitude": 34.4,
    "longitude": 132.45
  },
  {
    "city": "Ho Chi Minh City",
    "latitude": 10.8231,
    "longitude": 106.6297
  },
  {
    "city": "Ho Chi Minh City",
    "latitude": 10.82302,
    "longitude": 106.62965
  },
  {
    "city": "Hohhot",
    "latitude": 40.81056,
    "longitude": 111.65222
  },
  {
    "city": "Hollywood",
    "latitude": 26.0112,
    "longitude": -80.1495
  },
  {
    "city": "Holyoke",
    "latitude": 42.2042586,
    "longitude": -72.6162009
  },
  {
    "city": "Homestead",
    "latitude": 25.4687224,
    "longitude": -80.4775569
  },
  {
    "city": "Homs",
    "latitude": 34.72682,
    "longitude": 36.72339
  },
  {
    "city": "Hong Kong",
    "latitude": 22.3193,
    "longitude": 114.1694
  },
  {
    "city": "Hong Kong",
    "latitude": 22.27832,
    "longitude": 114.17469
  },
  {
    "city": "Honolulu",
    "latitude": 21.3069444,
    "longitude": -157.8583333
  },
  {
    "city": "House' s Joe Arroyo",
    "latitude": 10.98597,
    "longitude": -74.82172
  },
  {
    "city": "Houston",
    "latitude": 29.7604267,
    "longitude": -95.3698028
  },
  {
    "city": "Huai’an",
    "latitude": 33.50389,
    "longitude": 119.14417
  },
  {
    "city": "Huaibei",
    "latitude": 33.97444,
    "longitude": 116.79167
  },
  {
    "city": "Huainan",
    "latitude": 32.62639,
    "longitude": 116.99694
  },
  {
    "city": "Huangshi",
    "latitude": 30.24706,
    "longitude": 115.04814
  },
  {
    "city": "Hubli",
    "latitude": 15.34776,
    "longitude": 75.13378
  },
  {
    "city": "Huntington",
    "latitude": 38.4192496,
    "longitude": -82.44515400000002
  },
  {
    "city": "Huntington Beach",
    "latitude": 33.6595,
    "longitude": -117.9988
  },
  {
    "city": "Huntsville",
    "latitude": 34.7303688,
    "longitude": -86.5861037
  },
  {
    "city": "Huntsville",
    "latitude": 30.7235263,
    "longitude": -95.55077709999999
  },
  {
    "city": "Hutchinson",
    "latitude": 38.0608445,
    "longitude": -97.92977429999999
  },
  {
    "city": "Hyderabad",
    "latitude": 17.385,
    "longitude": 78.4867
  },
  {
    "city": "Hyderabad",
    "latitude": 17.38405,
    "longitude": 78.45636
  },
  {
    "city": "Hyderabad",
    "latitude": 25.39242,
    "longitude": 68.37366
  },
  {
    "city": "Ibadan",
    "latitude": 7.3775,
    "longitude": 3.947
  },
  {
    "city": "Ibadan",
    "latitude": 7.37756,
    "longitude": 3.90591
  },
  {
    "city": "Idaho Falls",
    "latitude": 43.49165139999999,
    "longitude": -112.0339645
  },
  {
    "city": "Illes Balears",
    "latitude": 39.60992,
    "longitude": 3.02948
  },
  {
    "city": "Ilorin",
    "latitude": 8.49664,
    "longitude": 4.54214
  },
  {
    "city": "Incheon",
    "latitude": 37.45646,
    "longitude": 126.70515
  },
  {
    "city": "Indianapolis",
    "latitude": 39.768403,
    "longitude": -86.158068
  },
  {
    "city": "Indore",
    "latitude": 22.71792,
    "longitude": 75.8333
  },
  {
    "city": "Inglewood",
    "latitude": 33.9617,
    "longitude": -118.3531
  },
  {
    "city": "Ipoh",
    "latitude": 4.5841,
    "longitude": 101.0829
  },
  {
    "city": "Irkutsk",
    "latitude": 52.29778,
    "longitude": 104.29639
  },
  {
    "city": "Irkutskaya Oblast’",
    "latitude": 56,
    "longitude": 106
  },
  {
    "city": "Irvine",
    "latitude": 33.6846,
    "longitude": -117.8265
  },
  {
    "city": "Irving",
    "latitude": 32.814,
    "longitude": -96.9489
  },
  {
    "city": "Isfahan",
    "latitude": 32.6546,
    "longitude": 51.668
  },
  {
    "city": "Isfahan",
    "latitude": 32.65246,
    "longitude": 51.67462
  },
  {
    "city": "Islamabad",
    "latitude": 33.72148,
    "longitude": 73.04329
  },
  {
    "city": "Ismailia Governorate",
    "latitude": 30.6,
    "longitude": 32.4
  },
  {
    "city": "Istanbul",
    "latitude": 41.0082,
    "longitude": 28.9784
  },
  {
    "city": "Istanbul",
    "latitude": 41.01384,
    "longitude": 28.94966
  },
  {
    "city": "İstanbul",
    "latitude": 41.03508,
    "longitude": 28.98331
  },
  {
    "city": "Italian Republic",
    "latitude": 42.83333,
    "longitude": 12.83333
  },
  {
    "city": "Izhevsk",
    "latitude": 56.84976,
    "longitude": 53.20448
  },
  {
    "city": "Izmir",
    "latitude": 38.4237,
    "longitude": 27.1428
  },
  {
    "city": "İzmir",
    "latitude": 38.46219,
    "longitude": 27.09229
  },
  {
    "city": "İzmir",
    "latitude": 38.41273,
    "longitude": 27.13838
  },
  {
    "city": "Iztapalapa",
    "latitude": 19.35529,
    "longitude": -99.06224
  },
  {
    "city": "Jabalpur",
    "latitude": 23.16697,
    "longitude": 79.95006
  },
  {
    "city": "Jaboatão",
    "latitude": -8.18028,
    "longitude": -35.00139
  },
  {
    "city": "Jaboatão dos Guararapes",
    "latitude": -8.11278,
    "longitude": -35.01472
  },
  {
    "city": "Jackson",
    "latitude": 32.2987573,
    "longitude": -90.1848103
  },
  {
    "city": "Jackson",
    "latitude": 35.6145169,
    "longitude": -88.81394689999999
  },
  {
    "city": "Jacksonville",
    "latitude": 30.3321838,
    "longitude": -81.65565099999999
  },
  {
    "city": "Jacksonville",
    "latitude": 34.7540524,
    "longitude": -77.4302414
  },
  {
    "city": "Jāfarābād District",
    "latitude": 28.30104,
    "longitude": 68.19783
  },
  {
    "city": "Jaipur",
    "latitude": 26.91962,
    "longitude": 75.78781
  },
  {
    "city": "Jakarta",
    "latitude": -6.2088,
    "longitude": 106.8456
  },
  {
    "city": "Jakarta",
    "latitude": -6.21462,
    "longitude": 106.84513
  },
  {
    "city": "Jalandhar",
    "latitude": 31.32556,
    "longitude": 75.57917
  },
  {
    "city": "Jamshedpur",
    "latitude": 22.80278,
    "longitude": 86.18545
  },
  {
    "city": "Janesville",
    "latitude": 42.6827885,
    "longitude": -89.0187222
  },
  {
    "city": "Jeddah",
    "latitude": 21.54238,
    "longitude": 39.19797
  },
  {
    "city": "Jefferson City",
    "latitude": 38.57670170000001,
    "longitude": -92.1735164
  },
  {
    "city": "Jeffersonville",
    "latitude": 38.2775702,
    "longitude": -85.7371847
  },
  {
    "city": "Jeonju",
    "latitude": 35.82194,
    "longitude": 127.14889
  },
  {
    "city": "Jersey City",
    "latitude": 40.7178,
    "longitude": -74.0431
  },
  {
    "city": "Jerusalem",
    "latitude": 31.7683,
    "longitude": 35.2137
  },
  {
    "city": "Jerusalem",
    "latitude": 31.76904,
    "longitude": 35.21633
  },
  {
    "city": "Jieyang",
    "latitude": 23.5418,
    "longitude": 116.36581
  },
  {
    "city": "Jilin",
    "latitude": 43.85083,
    "longitude": 126.56028
  },
  {
    "city": "Jinan",
    "latitude": 36.6512,
    "longitude": 117.1201
  },
  {
    "city": "Jinan",
    "latitude": 36.66833,
    "longitude": 116.99722
  },
  {
    "city": "Jinzhou",
    "latitude": 41.10778,
    "longitude": 121.14167
  },
  {
    "city": "João Pessoa",
    "latitude": -7.115,
    "longitude": -34.86306
  },
  {
    "city": "Jodhpur",
    "latitude": 26.26841,
    "longitude": 73.00594
  },
  {
    "city": "Johannesburg",
    "latitude": -26.2041,
    "longitude": 28.0473
  },
  {
    "city": "Johannesburg",
    "latitude": -26.20227,
    "longitude": 28.04363
  },
  {
    "city": "Johnson City",
    "latitude": 36.3134397,
    "longitude": -82.3534727
  },
  {
    "city": "Johor Bahru",
    "latitude": 1.4927,
    "longitude": 103.7414
  },
  {
    "city": "Johor Bahru",
    "latitude": 1.4655,
    "longitude": 103.7578
  },
  {
    "city": "Jonesboro",
    "latitude": 35.84229670000001,
    "longitude": -90.704279
  },
  {
    "city": "Jonglei",
    "latitude": 7.4,
    "longitude": 32.4
  },
  {
    "city": "Joplin",
    "latitude": 37.08422710000001,
    "longitude": -94.51328099999999
  },
  {
    "city": "Jos",
    "latitude": 9.92849,
    "longitude": 8.89212
  },
  {
    "city": "Juárez",
    "latitude": 31.72024,
    "longitude": -106.46084
  },
  {
    "city": "Juba",
    "latitude": 4.8594,
    "longitude": 31.5713
  },
  {
    "city": "Jurupa Valley",
    "latitude": 34,
    "longitude": -117.47
  },
  {
    "city": "Kabul",
    "latitude": 34.5553,
    "longitude": 69.2075
  },
  {
    "city": "Kabul",
    "latitude": 34.52813,
    "longitude": 69.17233
  },
  {
    "city": "Kabupaten Serdang Bedagai",
    "latitude": 3.36667,
    "longitude": 99.03333
  },
  {
    "city": "Kaduna",
    "latitude": 10.52641,
    "longitude": 7.43879
  },
  {
    "city": "Kahramanmaraş",
    "latitude": 38,
    "longitude": 37
  },
  {
    "city": "Kahrīz",
    "latitude": 34.3838,
    "longitude": 47.0553
  },
  {
    "city": "Kahului",
    "latitude": 20.8893351,
    "longitude": -156.4729469
  },
  {
    "city": "Kaifeng",
    "latitude": 34.7986,
    "longitude": 114.30742
  },
  {
    "city": "Kailua-Kona",
    "latitude": 19.639994,
    "longitude": -155.996933
  },
  {
    "city": "Kalamazoo",
    "latitude": 42.2917069,
    "longitude": -85.5872286
  },
  {
    "city": "Kalyān",
    "latitude": 19.2437,
    "longitude": 73.13554
  },
  {
    "city": "Kampala",
    "latitude": 0.3476,
    "longitude": 32.5825
  },
  {
    "city": "Kampala",
    "latitude": 0.31628,
    "longitude": 32.58219
  },
  {
    "city": "Kampung Baru Subang",
    "latitude": 3.15,
    "longitude": 101.53333
  },
  {
    "city": "Kano",
    "latitude": 12.0022,
    "longitude": 8.592
  },
  {
    "city": "Kano",
    "latitude": 12.00012,
    "longitude": 8.51672
  },
  {
    "city": "Kanpur",
    "latitude": 26.46523,
    "longitude": 80.34975
  },
  {
    "city": "Kansas City",
    "latitude": 39.0997265,
    "longitude": -94.5785667
  },
  {
    "city": "Kansas City",
    "latitude": 39.114053,
    "longitude": -94.6274636
  },
  {
    "city": "Kaohsiung",
    "latitude": 22.61626,
    "longitude": 120.31333
  },
  {
    "city": "Kapa'a",
    "latitude": 22.0881,
    "longitude": -159.338
  },
  {
    "city": "Karachi",
    "latitude": 24.8607,
    "longitude": 67.0011
  },
  {
    "city": "Karachi",
    "latitude": 24.8608,
    "longitude": 67.0104
  },
  {
    "city": "Karaj",
    "latitude": 35.84,
    "longitude": 51
  },
  {
    "city": "Karaj",
    "latitude": 35.83266,
    "longitude": 50.99155
  },
  {
    "city": "Kathmandu",
    "latitude": 27.70169,
    "longitude": 85.3206
  },
  {
    "city": "Kawaguchi-shi",
    "latitude": 35.83389,
    "longitude": 139.73252
  },
  {
    "city": "Kawasaki",
    "latitude": 35.52056,
    "longitude": 139.71722
  },
  {
    "city": "Kayseri",
    "latitude": 38.73222,
    "longitude": 35.48528
  },
  {
    "city": "Kazan",
    "latitude": 55.78874,
    "longitude": 49.12214
  },
  {
    "city": "Kemerovskaya Oblast’",
    "latitude": 55,
    "longitude": 86
  },
  {
    "city": "Kennewick",
    "latitude": 46.2112458,
    "longitude": -119.1372338
  },
  {
    "city": "Kenosha",
    "latitude": 42.5847425,
    "longitude": -87.82118539999999
  },
  {
    "city": "Kent",
    "latitude": 47.39,
    "longitude": -122.21
  },
  {
    "city": "Kent",
    "latitude": 51.16667,
    "longitude": 0.66667
  },
  {
    "city": "Kerman",
    "latitude": 30.28321,
    "longitude": 57.07879
  },
  {
    "city": "Kermanshah",
    "latitude": 34.31417,
    "longitude": 47.065
  },
  {
    "city": "Khabarovsk",
    "latitude": 48.48271,
    "longitude": 135.08379
  },
  {
    "city": "Khabarovsk Vtoroy",
    "latitude": 48.43776,
    "longitude": 135.13329
  },
  {
    "city": "Khabarovskiy Kray",
    "latitude": 55,
    "longitude": 134
  },
  {
    "city": "Khanty-Mansiyskiy Avtonomnyy Okrug-Yugra",
    "latitude": 62,
    "longitude": 72
  },
  {
    "city": "Kharkiv",
    "latitude": 49.98081,
    "longitude": 36.25272
  },
  {
    "city": "Khartoum",
    "latitude": 15.5007,
    "longitude": 32.5599
  },
  {
    "city": "Khartoum",
    "latitude": 15.55177,
    "longitude": 32.53241
  },
  {
    "city": "Khouèng Savannakhét",
    "latitude": 16.5,
    "longitude": 105.75
  },
  {
    "city": "Khulna",
    "latitude": 22.80979,
    "longitude": 89.56439
  },
  {
    "city": "Kigali",
    "latitude": -1.9441,
    "longitude": 30.0619
  },
  {
    "city": "Kigali",
    "latitude": -1.94995,
    "longitude": 30.05885
  },
  {
    "city": "Killeen",
    "latitude": 31.1171194,
    "longitude": -97.72779589999999
  },
  {
    "city": "Kingsport",
    "latitude": 36.548434,
    "longitude": -82.5618186
  },
  {
    "city": "Kingston",
    "latitude": 17.9712,
    "longitude": -76.7936
  },
  {
    "city": "Kingston",
    "latitude": 17.99702,
    "longitude": -76.79358
  },
  {
    "city": "Kinki Chihō",
    "latitude": 35,
    "longitude": 135.5
  },
  {
    "city": "Kinshasa",
    "latitude": -4.4419,
    "longitude": 15.2663
  },
  {
    "city": "Kinshasa",
    "latitude": -4.32758,
    "longitude": 15.31357
  },
  {
    "city": "Kirkuk",
    "latitude": 35.46806,
    "longitude": 44.39222
  },
  {
    "city": "Kirundo Province",
    "latitude": -2.58333,
    "longitude": 30.16667
  },
  {
    "city": "Kitakyushu",
    "latitude": 33.85181,
    "longitude": 130.85034
  },
  {
    "city": "Klang",
    "latitude": 3.03333,
    "longitude": 101.45
  },
  {
    "city": "Knoxville",
    "latitude": 35.9606384,
    "longitude": -83.9207392
  },
  {
    "city": "Kobe",
    "latitude": 34.6913,
    "longitude": 135.183
  },
  {
    "city": "Kocaeli",
    "latitude": 40.91667,
    "longitude": 29.91667
  },
  {
    "city": "Kochi Prefecture",
    "latitude": 33.58333,
    "longitude": 133.36667
  },
  {
    "city": "Kokomo",
    "latitude": 40.486427,
    "longitude": -86.13360329999999
  },
  {
    "city": "Kolkata",
    "latitude": 22.56263,
    "longitude": 88.36304
  },
  {
    "city": "Köln",
    "latitude": 50.93333,
    "longitude": 6.95
  },
  {
    "city": "Konya",
    "latitude": 37.87135,
    "longitude": 32.48464
  },
  {
    "city": "Kosice",
    "latitude": 48.66667,
    "longitude": 21.33333
  },
  {
    "city": "Kota",
    "latitude": 25.18254,
    "longitude": 75.83907
  },
  {
    "city": "Kota Bekasi",
    "latitude": -6.28333,
    "longitude": 106.98333
  },
  {
    "city": "Kota Bharu",
    "latitude": 6.13328,
    "longitude": 102.2386
  },
  {
    "city": "Kotli",
    "latitude": 33.51836,
    "longitude": 73.9022
  },
  {
    "city": "Kowloon",
    "latitude": 22.31667,
    "longitude": 114.18333
  },
  {
    "city": "Krakow",
    "latitude": 50.0647,
    "longitude": 19.945
  },
  {
    "city": "Kraków",
    "latitude": 50.06143,
    "longitude": 19.93658
  },
  {
    "city": "Krasnodar",
    "latitude": 45.04484,
    "longitude": 38.97603
  },
  {
    "city": "Krasnoyarsk",
    "latitude": 56.01839,
    "longitude": 92.86717
  },
  {
    "city": "Krasnoyarskiy Kray",
    "latitude": 58,
    "longitude": 93
  },
  {
    "city": "Kryvyi Rih",
    "latitude": 47.90966,
    "longitude": 33.38044
  },
  {
    "city": "Kuala Lumpur",
    "latitude": 3.139,
    "longitude": 101.6869
  },
  {
    "city": "Kuala Lumpur",
    "latitude": 3.1412,
    "longitude": 101.68653
  },
  {
    "city": "Kuching",
    "latitude": 1.55,
    "longitude": 110.33333
  },
  {
    "city": "Kumamoto",
    "latitude": 32.61667,
    "longitude": 130.75
  },
  {
    "city": "Kumamoto",
    "latitude": 32.80589,
    "longitude": 130.69181
  },
  {
    "city": "Kumasi",
    "latitude": 6.6666,
    "longitude": -1.6163
  },
  {
    "city": "Kumasi",
    "latitude": 6.68333,
    "longitude": -1.61667
  },
  {
    "city": "Kumasi",
    "latitude": 6.68848,
    "longitude": -1.62443
  },
  {
    "city": "Kunming",
    "latitude": 25.0389,
    "longitude": 102.7183
  },
  {
    "city": "Kunming",
    "latitude": 25.03889,
    "longitude": 102.71833
  },
  {
    "city": "Kunshan",
    "latitude": 31.37762,
    "longitude": 120.95431
  },
  {
    "city": "Kuwait City",
    "latitude": 29.3759,
    "longitude": 47.9774
  },
  {
    "city": "Kyiv",
    "latitude": 50.45466,
    "longitude": 30.5238
  },
  {
    "city": "Kyoto",
    "latitude": 35.02107,
    "longitude": 135.75385
  },
  {
    "city": "Kyoto Prefecture",
    "latitude": 35.25,
    "longitude": 135.43333
  },
  {
    "city": "Kyushu",
    "latitude": 32.42944,
    "longitude": 130.99099
  },
  {
    "city": "Kyūshū Chihō",
    "latitude": 32.33546,
    "longitude": 130.85082
  },
  {
    "city": "La Crosse",
    "latitude": 43.8013556,
    "longitude": -91.23958069999999
  },
  {
    "city": "La Habana",
    "latitude": 23.08333,
    "longitude": -82.3
  },
  {
    "city": "La Paz",
    "latitude": -16.4897,
    "longitude": -68.1193
  },
  {
    "city": "La Paz",
    "latitude": -16.5,
    "longitude": -68.15
  },
  {
    "city": "La Plata",
    "latitude": -34.92145,
    "longitude": -57.95453
  },
  {
    "city": "Lafayette",
    "latitude": 30.2240897,
    "longitude": -92.0198427
  },
  {
    "city": "Lafayette",
    "latitude": 40.4167022,
    "longitude": -86.87528689999999
  },
  {
    "city": "Lagos",
    "latitude": 6.5244,
    "longitude": 3.3792
  },
  {
    "city": "Lagos",
    "latitude": 6.45407,
    "longitude": 3.39467
  },
  {
    "city": "Lahore",
    "latitude": 31.558,
    "longitude": 74.35071
  },
  {
    "city": "Lake Charles",
    "latitude": 30.2265949,
    "longitude": -93.2173758
  },
  {
    "city": "Lake Havasu City",
    "latitude": 34.483901,
    "longitude": -114.3224548
  },
  {
    "city": "Lakeland",
    "latitude": 28.0395,
    "longitude": -81.9498
  },
  {
    "city": "Lakes",
    "latitude": 6.75,
    "longitude": 30
  },
  {
    "city": "Lakewood",
    "latitude": 39.7047,
    "longitude": -105.0814
  },
  {
    "city": "Lancaster",
    "latitude": 40.0378755,
    "longitude": -76.3055144
  },
  {
    "city": "Langfang",
    "latitude": 39.50972,
    "longitude": 116.69472
  },
  {
    "city": "Lansing",
    "latitude": 42.732535,
    "longitude": -84.5555347
  },
  {
    "city": "Lanzhou",
    "latitude": 36.05701,
    "longitude": 103.83987
  },
  {
    "city": "Lao People’s Democratic Republic",
    "latitude": 18,
    "longitude": 105
  },
  {
    "city": "Laredo",
    "latitude": 27.5305671,
    "longitude": -99.48032409999999
  },
  {
    "city": "Las Cruces",
    "latitude": 32.3199396,
    "longitude": -106.7636538
  },
  {
    "city": "Las Piñas",
    "latitude": 14.45056,
    "longitude": 120.98278
  },
  {
    "city": "Las Vegas",
    "latitude": 36.1699412,
    "longitude": -115.1398296
  },
  {
    "city": "Lawrence",
    "latitude": 38.9716689,
    "longitude": -95.2352501
  },
  {
    "city": "Lawrence",
    "latitude": 42.7070354,
    "longitude": -71.1631137
  },
  {
    "city": "Lawrence",
    "latitude": 39.8386516,
    "longitude": -86.0252612
  },
  {
    "city": "Lawton",
    "latitude": 34.6035669,
    "longitude": -98.39592909999999
  },
  {
    "city": "Layyah District",
    "latitude": 30.968,
    "longitude": 70.943
  },
  {
    "city": "Lazio",
    "latitude": 42.07762,
    "longitude": 12.77878
  },
  {
    "city": "Lee's Summit",
    "latitude": 38.92,
    "longitude": -94.38
  },
  {
    "city": "Leeds",
    "latitude": 53.8008,
    "longitude": -1.5491
  },
  {
    "city": "Leesburg",
    "latitude": 39.1156615,
    "longitude": -77.56360149999999
  },
  {
    "city": "Leominster",
    "latitude": 42.5250906,
    "longitude": -71.759794
  },
  {
    "city": "León de los Aldama",
    "latitude": 21.12908,
    "longitude": -101.67374
  },
  {
    "city": "Lewisville",
    "latitude": 33.0462,
    "longitude": -96.9942
  },
  {
    "city": "Lexington-Fayette",
    "latitude": 38.0405837,
    "longitude": -84.5037164
  },
  {
    "city": "Liaoyang",
    "latitude": 41.27194,
    "longitude": 123.17306
  },
  {
    "city": "Libreville",
    "latitude": 0.4162,
    "longitude": 9.4673
  },
  {
    "city": "Libreville",
    "latitude": 0.39241,
    "longitude": 9.45356
  },
  {
    "city": "Liguria",
    "latitude": 44.5,
    "longitude": 8.83333
  },
  {
    "city": "Lijiang",
    "latitude": 26.86879,
    "longitude": 100.22072
  },
  {
    "city": "Lilongwe",
    "latitude": -13.96692,
    "longitude": 33.78725
  },
  {
    "city": "Lima",
    "latitude": -12.0464,
    "longitude": -77.0428
  },
  {
    "city": "Lima",
    "latitude": 40.742551,
    "longitude": -84.1052256
  },
  {
    "city": "Lima",
    "latitude": -12.04318,
    "longitude": -77.02824
  },
  {
    "city": "Limerick",
    "latitude": 52.668,
    "longitude": -8.6305
  },
  {
    "city": "Lincoln",
    "latitude": 40.8257625,
    "longitude": -96.6851982
  },
  {
    "city": "Little Rock",
    "latitude": 34.7464809,
    "longitude": -92.28959479999999
  },
  {
    "city": "Liverpool",
    "latitude": 53.4084,
    "longitude": -2.9916
  },
  {
    "city": "Liverpool",
    "latitude": 53.41058,
    "longitude": -2.97794
  },
  {
    "city": "Livonia",
    "latitude": 42.37,
    "longitude": -83.36
  },
  {
    "city": "Łódź",
    "latitude": 51.75,
    "longitude": 19.46667
  },
  {
    "city": "Logan",
    "latitude": 41.7369803,
    "longitude": -111.8338359
  },
  {
    "city": "Lombardia",
    "latitude": 45.66667,
    "longitude": 9.5
  },
  {
    "city": "Lomé",
    "latitude": 6.12874,
    "longitude": 1.22154
  },
  {
    "city": "London",
    "latitude": 51.5074,
    "longitude": -0.1278
  },
  {
    "city": "London",
    "latitude": 51.5283079,
    "longitude": -0.1191549
  },
  {
    "city": "London",
    "latitude": 51.50853,
    "longitude": -0.12574
  },
  {
    "city": "Long Beach",
    "latitude": 33.7701,
    "longitude": -118.1937
  },
  {
    "city": "Longview",
    "latitude": 32.5007037,
    "longitude": -94.74048909999999
  },
  {
    "city": "Los Angeles",
    "latitude": 34.0522342,
    "longitude": -118.2436849
  },
  {
    "city": "Louisville",
    "latitude": 38.2526647,
    "longitude": -85.7584557
  },
  {
    "city": "Lowell",
    "latitude": 42.6334247,
    "longitude": -71.31617179999999
  },
  {
    "city": "Lower Mainland",
    "latitude": 49.08333,
    "longitude": -122.35
  },
  {
    "city": "Luancheng",
    "latitude": 37.87917,
    "longitude": 114.65167
  },
  {
    "city": "Luanda",
    "latitude": -8.839,
    "longitude": 13.2894
  },
  {
    "city": "Luanda",
    "latitude": -8.83682,
    "longitude": 13.23432
  },
  {
    "city": "Lubbock",
    "latitude": 33.5778631,
    "longitude": -101.8551665
  },
  {
    "city": "Lubumbashi",
    "latitude": -11.66089,
    "longitude": 27.47938
  },
  {
    "city": "Lucknow",
    "latitude": 26.83928,
    "longitude": 80.92313
  },
  {
    "city": "Ludhiāna",
    "latitude": 30.91204,
    "longitude": 75.85379
  },
  {
    "city": "Luoyang",
    "latitude": 34.68361,
    "longitude": 112.45361
  },
  {
    "city": "Lusaka",
    "latitude": -15.3875,
    "longitude": 28.3228
  },
  {
    "city": "Lusaka",
    "latitude": -15.40669,
    "longitude": 28.28713
  },
  {
    "city": "Luxembourg City",
    "latitude": 49.6117,
    "longitude": 6.1319
  },
  {
    "city": "Lviv",
    "latitude": 49.83826,
    "longitude": 24.02324
  },
  {
    "city": "Lynchburg",
    "latitude": 37.4137536,
    "longitude": -79.14224639999999
  },
  {
    "city": "Lynn",
    "latitude": 42.46676300000001,
    "longitude": -70.9494938
  },
  {
    "city": "Maceió",
    "latitude": -9.66583,
    "longitude": -35.73528
  },
  {
    "city": "Macon",
    "latitude": 32.8406946,
    "longitude": -83.6324022
  },
  {
    "city": "Madagascar",
    "latitude": -20.03085,
    "longitude": 45.695
  },
  {
    "city": "Madison",
    "latitude": 43.0730517,
    "longitude": -89.4012302
  },
  {
    "city": "Madrid",
    "latitude": 40.4168,
    "longitude": -3.7038
  },
  {
    "city": "Madrid",
    "latitude": 40.4165,
    "longitude": -3.70256
  },
  {
    "city": "Madrid",
    "latitude": 40.48935,
    "longitude": -3.68275
  },
  {
    "city": "Madurai",
    "latitude": 9.91769,
    "longitude": 78.11898
  },
  {
    "city": "Maekel Region",
    "latitude": 15.33333,
    "longitude": 38.91667
  },
  {
    "city": "Maiduguri",
    "latitude": 11.84692,
    "longitude": 13.15712
  },
  {
    "city": "Makassar",
    "latitude": -5.14861,
    "longitude": 119.43194
  },
  {
    "city": "Málaga",
    "latitude": 36.72016,
    "longitude": -4.42034
  },
  {
    "city": "Málaga",
    "latitude": 36.75854,
    "longitude": -4.39717
  },
  {
    "city": "Malang",
    "latitude": -7.9797,
    "longitude": 112.6304
  },
  {
    "city": "Malden",
    "latitude": 42.4250964,
    "longitude": -71.066163
  },
  {
    "city": "Malingao",
    "latitude": 7.16083,
    "longitude": 124.475
  },
  {
    "city": "Mallorca",
    "latitude": 39.61362,
    "longitude": 3.02004
  },
  {
    "city": "Managua",
    "latitude": 12.13282,
    "longitude": -86.2504
  },
  {
    "city": "Manama",
    "latitude": 26.2285,
    "longitude": 50.5861
  },
  {
    "city": "Manaus",
    "latitude": -3.119,
    "longitude": -60.0217
  },
  {
    "city": "Manaus",
    "latitude": -3.10194,
    "longitude": -60.025
  },
  {
    "city": "Manchester",
    "latitude": 42.9956397,
    "longitude": -71.4547891
  },
  {
    "city": "Manchester",
    "latitude": 53.4808,
    "longitude": -2.2426
  },
  {
    "city": "Mandalay",
    "latitude": 21.97473,
    "longitude": 96.08359
  },
  {
    "city": "Manhattan",
    "latitude": 39.18360819999999,
    "longitude": -96.57166939999999
  },
  {
    "city": "Manila",
    "latitude": 14.5995,
    "longitude": 120.9842
  },
  {
    "city": "Manila",
    "latitude": 14.6042,
    "longitude": 120.9822
  },
  {
    "city": "Mankato",
    "latitude": 44.1635775,
    "longitude": -93.99939959999999
  },
  {
    "city": "Mansfield",
    "latitude": 40.75839,
    "longitude": -82.5154471
  },
  {
    "city": "Maputo",
    "latitude": -25.9692,
    "longitude": 32.5732
  },
  {
    "city": "Maputo",
    "latitude": -25.96553,
    "longitude": 32.58322
  },
  {
    "city": "Maracaibo",
    "latitude": 10.6333,
    "longitude": -71.6333
  },
  {
    "city": "Maracaibo",
    "latitude": 10.66663,
    "longitude": -71.61245
  },
  {
    "city": "Maracay",
    "latitude": 10.23535,
    "longitude": -67.59113
  },
  {
    "city": "Maranhão",
    "latitude": -5,
    "longitude": -45
  },
  {
    "city": "Marche",
    "latitude": 43.5,
    "longitude": 13.25
  },
  {
    "city": "Marlborough",
    "latitude": 42.3459271,
    "longitude": -71.5522874
  },
  {
    "city": "Marrakech",
    "latitude": 31.6295,
    "longitude": -7.9811
  },
  {
    "city": "Marrakesh",
    "latitude": 31.63416,
    "longitude": -7.99994
  },
  {
    "city": "Marseille",
    "latitude": 43.29695,
    "longitude": 5.38107
  },
  {
    "city": "Mashhad",
    "latitude": 36.2605,
    "longitude": 59.6168
  },
  {
    "city": "Mashhad",
    "latitude": 36.31559,
    "longitude": 59.56796
  },
  {
    "city": "Matola",
    "latitude": -25.96222,
    "longitude": 32.45889
  },
  {
    "city": "Mbuji-Mayi",
    "latitude": -6.13603,
    "longitude": 23.58979
  },
  {
    "city": "McAllen",
    "latitude": 26.22,
    "longitude": -98.25
  },
  {
    "city": "McKinney",
    "latitude": 33.1976164,
    "longitude": -96.6152693
  },
  {
    "city": "Mecca",
    "latitude": 21.42664,
    "longitude": 39.82563
  },
  {
    "city": "Medan",
    "latitude": 3.58333,
    "longitude": 98.66667
  },
  {
    "city": "Medellín",
    "latitude": 6.2442,
    "longitude": -75.5812
  },
  {
    "city": "Medellín",
    "latitude": 6.25184,
    "longitude": -75.56359
  },
  {
    "city": "Medford",
    "latitude": 42.3265152,
    "longitude": -122.8755949
  },
  {
    "city": "Medford",
    "latitude": 42.4184296,
    "longitude": -71.1061639
  },
  {
    "city": "Medina",
    "latitude": 24.46861,
    "longitude": 39.61417
  },
  {
    "city": "Meerut",
    "latitude": 28.98002,
    "longitude": 77.70636
  },
  {
    "city": "Melbourne",
    "latitude": -37.8136,
    "longitude": 144.9631
  },
  {
    "city": "Melbourne",
    "latitude": -37.814,
    "longitude": 144.96332
  },
  {
    "city": "Memphis",
    "latitude": 35.1495343,
    "longitude": -90.0489801
  },
  {
    "city": "Mendoza",
    "latitude": -32.89084,
    "longitude": -68.82717
  },
  {
    "city": "Merced",
    "latitude": 37.3021632,
    "longitude": -120.4829677
  },
  {
    "city": "Mérida",
    "latitude": 20.97537,
    "longitude": -89.61696
  },
  {
    "city": "Meridian",
    "latitude": 43.6121087,
    "longitude": -116.3915131
  },
  {
    "city": "Meridian",
    "latitude": 32.3643098,
    "longitude": -88.703656
  },
  {
    "city": "Mersin",
    "latitude": 36.86204,
    "longitude": 34.65088
  },
  {
    "city": "Mesa",
    "latitude": 33.4152,
    "longitude": -111.8315
  },
  {
    "city": "Mesquite",
    "latitude": 32.76,
    "longitude": -96.59
  },
  {
    "city": "Methuen",
    "latitude": 42.7262016,
    "longitude": -71.1908924
  },
  {
    "city": "Mexicali",
    "latitude": 32.62781,
    "longitude": -115.45446
  },
  {
    "city": "Mexico City",
    "latitude": 19.4326,
    "longitude": -99.1332
  },
  {
    "city": "Mexico City",
    "latitude": 19.42847,
    "longitude": -99.12766
  },
  {
    "city": "Miami",
    "latitude": 25.7616798,
    "longitude": -80.1917902
  },
  {
    "city": "Midland",
    "latitude": 31.9973456,
    "longitude": -102.0779146
  },
  {
    "city": "Midland",
    "latitude": 43.6155825,
    "longitude": -84.2472116
  },
  {
    "city": "Mie-ken",
    "latitude": 34.52123,
    "longitude": 136.38296
  },
  {
    "city": "Milan",
    "latitude": 45.4642,
    "longitude": 9.19
  },
  {
    "city": "Milan",
    "latitude": 45.46427,
    "longitude": 9.18951
  },
  {
    "city": "Milano",
    "latitude": 45.46416,
    "longitude": 9.19199
  },
  {
    "city": "Milwaukee",
    "latitude": 43.0389025,
    "longitude": -87.9064736
  },
  {
    "city": "Minneapolis",
    "latitude": 44.977753,
    "longitude": -93.2650108
  },
  {
    "city": "Minot",
    "latitude": 48.2329668,
    "longitude": -101.2922906
  },
  {
    "city": "Minsk",
    "latitude": 53.9,
    "longitude": 27.56667
  },
  {
    "city": "Miramar",
    "latitude": 25.9861,
    "longitude": -80.3036
  },
  {
    "city": "Mishawaka",
    "latitude": 41.6619927,
    "longitude": -86.15861559999999
  },
  {
    "city": "Mississauga",
    "latitude": 43.5789,
    "longitude": -79.6583
  },
  {
    "city": "Missoula",
    "latitude": 46.87871759999999,
    "longitude": -113.996586
  },
  {
    "city": "Miyazaki",
    "latitude": 32.2,
    "longitude": 131.3
  },
  {
    "city": "Mobile",
    "latitude": 30.6953657,
    "longitude": -88.0398912
  },
  {
    "city": "Modesto",
    "latitude": 37.64,
    "longitude": -121
  },
  {
    "city": "Mogadishu",
    "latitude": 2.0469,
    "longitude": 45.3182
  },
  {
    "city": "Mogadishu",
    "latitude": 2.03711,
    "longitude": 45.34375
  },
  {
    "city": "Moline",
    "latitude": 41.5067003,
    "longitude": -90.51513419999999
  },
  {
    "city": "Mombasa",
    "latitude": -4.0435,
    "longitude": 39.6682
  },
  {
    "city": "Mombasa",
    "latitude": -4.05466,
    "longitude": 39.66359
  },
  {
    "city": "Mongala",
    "latitude": 2.06667,
    "longitude": 21.51667
  },
  {
    "city": "Monroe",
    "latitude": 32.5093109,
    "longitude": -92.1193012
  },
  {
    "city": "Monrovia",
    "latitude": 6.30054,
    "longitude": -10.7969
  },
  {
    "city": "Montego Bay",
    "latitude": 18.4762,
    "longitude": -77.8939
  },
  {
    "city": "Monterrey",
    "latitude": 25.67507,
    "longitude": -100.31847
  },
  {
    "city": "Montevideo",
    "latitude": -34.90328,
    "longitude": -56.18816
  },
  {
    "city": "Montgomery",
    "latitude": 32.3668052,
    "longitude": -86.2999689
  },
  {
    "city": "Montreal",
    "latitude": 45.5017,
    "longitude": -73.5673
  },
  {
    "city": "Montréal",
    "latitude": 45.50884,
    "longitude": -73.58781
  },
  {
    "city": "Moorhead",
    "latitude": 46.8737648,
    "longitude": -96.76780389999999
  },
  {
    "city": "Morādābād",
    "latitude": 28.83893,
    "longitude": 78.77684
  },
  {
    "city": "Morelia",
    "latitude": 19.70078,
    "longitude": -101.18443
  },
  {
    "city": "Moreno Valley",
    "latitude": 33.9425,
    "longitude": -117.2297
  },
  {
    "city": "Moscow",
    "latitude": 55.75222,
    "longitude": 37.61556
  },
  {
    "city": "Mosul",
    "latitude": 36.335,
    "longitude": 43.11889
  },
  {
    "city": "Mount Pleasant",
    "latitude": 32.8323,
    "longitude": -79.8284
  },
  {
    "city": "Mudanjiang",
    "latitude": 44.58333,
    "longitude": 129.6
  },
  {
    "city": "Muḩāfaz̧at ad Daqahlīyah",
    "latitude": 31.1,
    "longitude": 31.6
  },
  {
    "city": "Muḩāfaz̧at al Fayyūm",
    "latitude": 29.3,
    "longitude": 30.5
  },
  {
    "city": "Muḩāfaz̧at al Gharbīyah",
    "latitude": 30.9,
    "longitude": 31
  },
  {
    "city": "Muḩāfaz̧at al Iskandarīyah",
    "latitude": 31,
    "longitude": 29.75
  },
  {
    "city": "Muḩāfaz̧at al Jīzah",
    "latitude": 29.99776,
    "longitude": 31.05286
  },
  {
    "city": "Muḩāfaz̧at al Minūfīyah",
    "latitude": 30.5,
    "longitude": 31
  },
  {
    "city": "Muḩāfaz̧at al Minyā",
    "latitude": 28.1,
    "longitude": 30
  },
  {
    "city": "Muḩāfaz̧at al Qalyūbīyah",
    "latitude": 30.3,
    "longitude": 31.25
  },
  {
    "city": "Muḩāfaz̧at ash Sharqīyah",
    "latitude": 30.7,
    "longitude": 31.8
  },
  {
    "city": "Muḩāfaz̧at Aswān",
    "latitude": 23.3,
    "longitude": 32.9
  },
  {
    "city": "Muḩāfaz̧at Asyūţ",
    "latitude": 27.2,
    "longitude": 31.1
  },
  {
    "city": "Muḩāfaz̧at Banī Suwayf",
    "latitude": 28.9,
    "longitude": 30.6
  },
  {
    "city": "Muḩāfaz̧at Masqaţ",
    "latitude": 23.5835,
    "longitude": 58.40366
  },
  {
    "city": "Multān",
    "latitude": 30.19679,
    "longitude": 71.47824
  },
  {
    "city": "Mumbai",
    "latitude": 19.076,
    "longitude": 72.8777
  },
  {
    "city": "Mumbai",
    "latitude": 19.07283,
    "longitude": 72.88261
  },
  {
    "city": "Muncie",
    "latitude": 40.1933767,
    "longitude": -85.3863599
  },
  {
    "city": "Munich",
    "latitude": 48.1351,
    "longitude": 11.582
  },
  {
    "city": "Munich",
    "latitude": 48.13743,
    "longitude": 11.57549
  },
  {
    "city": "Murcia",
    "latitude": 37.98662,
    "longitude": -1.14146
  },
  {
    "city": "Murfreesboro",
    "latitude": 35.8456,
    "longitude": -86.3903
  },
  {
    "city": "Muscat",
    "latitude": 23.588,
    "longitude": 58.3829
  },
  {
    "city": "Muscat",
    "latitude": 23.58413,
    "longitude": 58.40778
  },
  {
    "city": "Muskogee",
    "latitude": 35.7478769,
    "longitude": -95.3696909
  },
  {
    "city": "Muyinga Province",
    "latitude": -2.83333,
    "longitude": 30.33333
  },
  {
    "city": "Muzaffarābād",
    "latitude": 34.37002,
    "longitude": 73.47082
  },
  {
    "city": "Mysore",
    "latitude": 12.29791,
    "longitude": 76.63925
  },
  {
    "city": "N'Djamena",
    "latitude": 12.10672,
    "longitude": 15.0444
  },
  {
    "city": "Nagano-ken",
    "latitude": 36.13464,
    "longitude": 138.04077
  },
  {
    "city": "Nagasaki Prefecture",
    "latitude": 33.23333,
    "longitude": 129.6
  },
  {
    "city": "Nagoya",
    "latitude": 35.1815,
    "longitude": 136.9066
  },
  {
    "city": "Nagoya",
    "latitude": 35.18147,
    "longitude": 136.90641
  },
  {
    "city": "Nagpur",
    "latitude": 21.14631,
    "longitude": 79.08491
  },
  {
    "city": "Nairobi",
    "latitude": -1.2921,
    "longitude": 36.8219
  },
  {
    "city": "Nairobi",
    "latitude": -1.28333,
    "longitude": 36.81667
  },
  {
    "city": "Nampa",
    "latitude": 43.5407172,
    "longitude": -116.5634624
  },
  {
    "city": "Nan’an Qu",
    "latitude": 29.54083,
    "longitude": 106.58972
  },
  {
    "city": "Nanchang",
    "latitude": 28.68396,
    "longitude": 115.85306
  },
  {
    "city": "Nanchong",
    "latitude": 30.79508,
    "longitude": 106.08473
  },
  {
    "city": "Nanjing",
    "latitude": 32.0603,
    "longitude": 118.7969
  },
  {
    "city": "Nanjing",
    "latitude": 32.06167,
    "longitude": 118.77778
  },
  {
    "city": "Nanning",
    "latitude": 22.81667,
    "longitude": 108.31667
  },
  {
    "city": "Nantong",
    "latitude": 32.03028,
    "longitude": 120.87472
  },
  {
    "city": "Naples",
    "latitude": 40.8518,
    "longitude": 14.2681
  },
  {
    "city": "Naples",
    "latitude": 40.85216,
    "longitude": 14.26811
  },
  {
    "city": "Nara-ken",
    "latitude": 34.68525,
    "longitude": 135.83289
  },
  {
    "city": "Nashik",
    "latitude": 19.99727,
    "longitude": 73.79096
  },
  {
    "city": "Nashua",
    "latitude": 42.7653662,
    "longitude": -71.46756599999999
  },
  {
    "city": "Nashville",
    "latitude": 36.1626638,
    "longitude": -86.7816016
  },
  {
    "city": "Nassau",
    "latitude": 25.0343,
    "longitude": -77.3963
  },
  {
    "city": "Natal",
    "latitude": -5.795,
    "longitude": -35.20944
  },
  {
    "city": "Naucalpan de Juárez",
    "latitude": 19.47851,
    "longitude": -99.23963
  },
  {
    "city": "Naushahro Fīroz District",
    "latitude": 26.8756,
    "longitude": 68.12067
  },
  {
    "city": "Navi Mumbai",
    "latitude": 19.03681,
    "longitude": 73.01582
  },
  {
    "city": "Nay Pyi Taw",
    "latitude": 19.745,
    "longitude": 96.12972
  },
  {
    "city": "New Bedford",
    "latitude": 41.6362152,
    "longitude": -70.93420499999999
  },
  {
    "city": "New Berlin",
    "latitude": 42.9764027,
    "longitude": -88.1084224
  },
  {
    "city": "New Brunswick",
    "latitude": 40.4862157,
    "longitude": -74.4518188
  },
  {
    "city": "New Haven",
    "latitude": 41.308274,
    "longitude": -72.9278835
  },
  {
    "city": "New Kingston",
    "latitude": 18.00747,
    "longitude": -76.78319
  },
  {
    "city": "New Orleans",
    "latitude": 29.95106579999999,
    "longitude": -90.0715323
  },
  {
    "city": "New Rochelle",
    "latitude": 40.9115,
    "longitude": -73.7824
  },
  {
    "city": "New York",
    "latitude": 40.7127837,
    "longitude": -74.0059413
  },
  {
    "city": "Newark",
    "latitude": 40.735657,
    "longitude": -74.1723667
  },
  {
    "city": "Newport Beach",
    "latitude": 33.6189101,
    "longitude": -117.9289469
  },
  {
    "city": "Newport News",
    "latitude": 37.0871,
    "longitude": -76.473
  },
  {
    "city": "Newton",
    "latitude": 42.3370413,
    "longitude": -71.20922139999999
  },
  {
    "city": "Ngozi Province",
    "latitude": -2.875,
    "longitude": 29.925
  },
  {
    "city": "Niagara Falls",
    "latitude": 43.0962143,
    "longitude": -79.0377388
  },
  {
    "city": "Niamey",
    "latitude": 13.51366,
    "longitude": 2.1098
  },
  {
    "city": "Niigata-ken",
    "latitude": 37.52343,
    "longitude": 138.91748
  },
  {
    "city": "Ningbo",
    "latitude": 29.8683,
    "longitude": 121.544
  },
  {
    "city": "Ningbo",
    "latitude": 29.87819,
    "longitude": 121.54945
  },
  {
    "city": "Nitra",
    "latitude": 48.16667,
    "longitude": 18.33333
  },
  {
    "city": "Nizhniy Novgorod",
    "latitude": 56.32867,
    "longitude": 44.00205
  },
  {
    "city": "Noblesville",
    "latitude": 40.0455917,
    "longitude": -86.0085955
  },
  {
    "city": "Norfolk",
    "latitude": 36.8508,
    "longitude": -76.2859
  },
  {
    "city": "Norman",
    "latitude": 35.24,
    "longitude": -97.35
  },
  {
    "city": "North Central Coast",
    "latitude": 16.47129,
    "longitude": 107.58478
  },
  {
    "city": "North Charleston",
    "latitude": 32.8546,
    "longitude": -79.9748
  },
  {
    "city": "North Las Vegas",
    "latitude": 36.1989,
    "longitude": -115.1175
  },
  {
    "city": "North Macedonia",
    "latitude": 41.66667,
    "longitude": 21.75
  },
  {
    "city": "North York",
    "latitude": 43.76681,
    "longitude": -79.4163
  },
  {
    "city": "Northeast",
    "latitude": 21.70032,
    "longitude": 106.19604
  },
  {
    "city": "Northern Bahr el Ghazal",
    "latitude": 8.85,
    "longitude": 27
  },
  {
    "city": "Northern Province",
    "latitude": 9.15,
    "longitude": -11.53333
  },
  {
    "city": "Northern Red Sea Region",
    "latitude": 16,
    "longitude": 39
  },
  {
    "city": "Northwest",
    "latitude": 21.7697,
    "longitude": 103.79883
  },
  {
    "city": "Nottingham",
    "latitude": 52.9536,
    "longitude": -1.15047
  },
  {
    "city": "Nouakchott",
    "latitude": 18.08581,
    "longitude": -15.9785
  },
  {
    "city": "Nova Iguaçu",
    "latitude": -22.75917,
    "longitude": -43.45111
  },
  {
    "city": "Nova Scotia",
    "latitude": 45.00015,
    "longitude": -62.99865
  },
  {
    "city": "Novosibirsk",
    "latitude": 55.0415,
    "longitude": 82.9346
  },
  {
    "city": "Nowrangapur",
    "latitude": 19.23114,
    "longitude": 82.54826
  },
  {
    "city": "Nur-Sultan",
    "latitude": 51.1605,
    "longitude": 71.4704
  },
  {
    "city": "Nyala",
    "latitude": 12.04888,
    "longitude": 24.88069
  },
  {
    "city": "Oakland",
    "latitude": 37.8044,
    "longitude": -122.2711
  },
  {
    "city": "Ocala",
    "latitude": 29.1871986,
    "longitude": -82.14009229999999
  },
  {
    "city": "Oceanside",
    "latitude": 33.1958696,
    "longitude": -117.3794834
  },
  {
    "city": "Odessa",
    "latitude": 46.47747,
    "longitude": 30.73262
  },
  {
    "city": "Oita Prefecture",
    "latitude": 33.19899,
    "longitude": 131.43353
  },
  {
    "city": "Okayama",
    "latitude": 34.65,
    "longitude": 133.93333
  },
  {
    "city": "Okayama-ken",
    "latitude": 34.90204,
    "longitude": 133.81018
  },
  {
    "city": "Okinawa",
    "latitude": 26.5,
    "longitude": 127.93333
  },
  {
    "city": "Okinawa",
    "latitude": 26.53806,
    "longitude": 127.96778
  },
  {
    "city": "Oklahoma City",
    "latitude": 35.4675602,
    "longitude": -97.5164276
  },
  {
    "city": "Olathe",
    "latitude": 38.88,
    "longitude": -94.82
  },
  {
    "city": "Olympia",
    "latitude": 47.0378741,
    "longitude": -122.9006951
  },
  {
    "city": "Omaha",
    "latitude": 41.2523634,
    "longitude": -95.99798829999999
  },
  {
    "city": "Omdurman",
    "latitude": 15.64453,
    "longitude": 32.47773
  },
  {
    "city": "Omsk",
    "latitude": 54.99244,
    "longitude": 73.36859
  },
  {
    "city": "Onitsha",
    "latitude": 6.14978,
    "longitude": 6.78569
  },
  {
    "city": "Ontario",
    "latitude": 34.0633,
    "longitude": -117.6509
  },
  {
    "city": "Ontario",
    "latitude": 49.25014,
    "longitude": -84.49983
  },
  {
    "city": "Oran",
    "latitude": 35.69906,
    "longitude": -0.63588
  },
  {
    "city": "Orange",
    "latitude": 33.79,
    "longitude": -117.86
  },
  {
    "city": "Ordos",
    "latitude": 39.6086,
    "longitude": 109.78157
  },
  {
    "city": "Ordu",
    "latitude": 40.90858,
    "longitude": 37.68448
  },
  {
    "city": "Orlando",
    "latitude": 28.5383355,
    "longitude": -81.3792365
  },
  {
    "city": "Orūmīyeh",
    "latitude": 37.55274,
    "longitude": 45.07605
  },
  {
    "city": "Osaka",
    "latitude": 34.6937,
    "longitude": 135.5023
  },
  {
    "city": "Osaka",
    "latitude": 34.69374,
    "longitude": 135.50218
  },
  {
    "city": "Ōsaka-fu",
    "latitude": 34.68631,
    "longitude": 135.51968
  },
  {
    "city": "Osasco",
    "latitude": -23.5325,
    "longitude": -46.79167
  },
  {
    "city": "Oshkosh",
    "latitude": 44.0247062,
    "longitude": -88.5426136
  },
  {
    "city": "Oslo",
    "latitude": 59.9139,
    "longitude": 10.7522
  },
  {
    "city": "Oslo",
    "latitude": 59.91273,
    "longitude": 10.74609
  },
  {
    "city": "Ottawa",
    "latitude": 45.4215,
    "longitude": -75.6972
  },
  {
    "city": "Ottawa",
    "latitude": 45.41117,
    "longitude": -75.69812
  },
  {
    "city": "Ouagadougou",
    "latitude": 12.3714,
    "longitude": -1.5197
  },
  {
    "city": "Ouagadougou",
    "latitude": 12.36566,
    "longitude": -1.53388
  },
  {
    "city": "Overland Park",
    "latitude": 38.89,
    "longitude": -94.69
  },
  {
    "city": "Owensboro",
    "latitude": 37.7719074,
    "longitude": -87.1111676
  },
  {
    "city": "Oxnard",
    "latitude": 34.1975,
    "longitude": -119.1771
  },
  {
    "city": "Oyo",
    "latitude": 7.85257,
    "longitude": 3.93125
  },
  {
    "city": "Padang",
    "latitude": -0.94924,
    "longitude": 100.35427
  },
  {
    "city": "Palembang",
    "latitude": -2.91673,
    "longitude": 104.7458
  },
  {
    "city": "Palermo",
    "latitude": 38.11572,
    "longitude": 13.36143
  },
  {
    "city": "Palermo",
    "latitude": 38.13205,
    "longitude": 13.33561
  },
  {
    "city": "Palm Bay",
    "latitude": 27.96,
    "longitude": -80.66
  },
  {
    "city": "Palm Coast",
    "latitude": 29.5844524,
    "longitude": -81.20786989999999
  },
  {
    "city": "Palm Desert",
    "latitude": 33.7222445,
    "longitude": -116.3744556
  },
  {
    "city": "Panshan",
    "latitude": 41.18806,
    "longitude": 122.04944
  },
  {
    "city": "Paraná",
    "latitude": -24.5,
    "longitude": -51.33333
  },
  {
    "city": "Paris",
    "latitude": 48.8566,
    "longitude": 2.3522
  },
  {
    "city": "Paris",
    "latitude": 48.85341,
    "longitude": 2.3488
  },
  {
    "city": "Pasadena",
    "latitude": 34.1478,
    "longitude": -118.1445
  },
  {
    "city": "Pasadena (TX)",
    "latitude": 29.6911,
    "longitude": -95.2091
  },
  {
    "city": "Pasig City",
    "latitude": 14.58691,
    "longitude": 121.0614
  },
  {
    "city": "Pasragad Branch",
    "latitude": 34.77772,
    "longitude": 48.47168
  },
  {
    "city": "Paterson",
    "latitude": 40.9168,
    "longitude": -74.1718
  },
  {
    "city": "Patna",
    "latitude": 25.59408,
    "longitude": 85.13563
  },
  {
    "city": "Peabody",
    "latitude": 42.5278731,
    "longitude": -70.9286609
  },
  {
    "city": "Pearland",
    "latitude": 29.56,
    "longitude": -95.32
  },
  {
    "city": "Pekanbaru",
    "latitude": 0.51667,
    "longitude": 101.44167
  },
  {
    "city": "Pensacola",
    "latitude": 30.42130899999999,
    "longitude": -87.2169149
  },
  {
    "city": "Peoria",
    "latitude": 33.5806,
    "longitude": -112.2374
  },
  {
    "city": "Peoria",
    "latitude": 40.6936488,
    "longitude": -89.5889864
  },
  {
    "city": "Perm",
    "latitude": 58.01046,
    "longitude": 56.25017
  },
  {
    "city": "Perth",
    "latitude": -31.9505,
    "longitude": 115.8605
  },
  {
    "city": "Perth",
    "latitude": -31.95224,
    "longitude": 115.8614
  },
  {
    "city": "Peshawar",
    "latitude": 34.008,
    "longitude": 71.57849
  },
  {
    "city": "Philadelphia",
    "latitude": 39.9525839,
    "longitude": -75.1652215
  },
  {
    "city": "Phnom Penh",
    "latitude": 11.56245,
    "longitude": 104.91601
  },
  {
    "city": "Phoenix",
    "latitude": 33.4483771,
    "longitude": -112.0740373
  },
  {
    "city": "Pietermaritzburg",
    "latitude": -29.61679,
    "longitude": 30.39278
  },
  {
    "city": "Pikine",
    "latitude": 14.76457,
    "longitude": -17.39071
  },
  {
    "city": "Pimpri",
    "latitude": 18.62292,
    "longitude": 73.80696
  },
  {
    "city": "Pine Bluff",
    "latitude": 34.2284312,
    "longitude": -92.00319549999999
  },
  {
    "city": "Pingdingshan",
    "latitude": 33.73847,
    "longitude": 113.30119
  },
  {
    "city": "Pittsburgh",
    "latitude": 40.44062479999999,
    "longitude": -79.9958864
  },
  {
    "city": "Pittsfield",
    "latitude": 42.4500845,
    "longitude": -73.2453824
  },
  {
    "city": "Plainfield",
    "latitude": 40.6337136,
    "longitude": -74.4073736
  },
  {
    "city": "Plano",
    "latitude": 33.0198,
    "longitude": -96.6989
  },
  {
    "city": "Plantation",
    "latitude": 26.1276,
    "longitude": -80.2331
  },
  {
    "city": "Pocatello",
    "latitude": 42.8713032,
    "longitude": -112.4455344
  },
  {
    "city": "Pointe-Noire",
    "latitude": -4.77609,
    "longitude": 11.86352
  },
  {
    "city": "Pomona",
    "latitude": 34.0551,
    "longitude": -117.749
  },
  {
    "city": "Pompano Beach",
    "latitude": 26.2379,
    "longitude": -80.1248
  },
  {
    "city": "Port Elizabeth",
    "latitude": -33.9608,
    "longitude": 25.6022
  },
  {
    "city": "Port Elizabeth",
    "latitude": -33.96109,
    "longitude": 25.61494
  },
  {
    "city": "Port Harcourt",
    "latitude": 4.8242,
    "longitude": 7.0336
  },
  {
    "city": "Port Harcourt",
    "latitude": 4.77742,
    "longitude": 7.0134
  },
  {
    "city": "Port Louis",
    "latitude": -20.1609,
    "longitude": 57.5012
  },
  {
    "city": "Port of Spain",
    "latitude": 10.6549,
    "longitude": -61.5019
  },
  {
    "city": "Port St. Lucie",
    "latitude": 27.2730492,
    "longitude": -80.3582261
  },
  {
    "city": "Port Sudan",
    "latitude": 19.6158,
    "longitude": 37.2164
  },
  {
    "city": "Port-au-Prince",
    "latitude": 18.5944,
    "longitude": -72.3074
  },
  {
    "city": "Port-au-Prince",
    "latitude": 18.54349,
    "longitude": -72.33881
  },
  {
    "city": "Portland",
    "latitude": 45.5230622,
    "longitude": -122.6764816
  },
  {
    "city": "Portland",
    "latitude": 43.6591,
    "longitude": -70.2568
  },
  {
    "city": "Portland",
    "latitude": 43.66147100000001,
    "longitude": -70.2553259
  },
  {
    "city": "Porto",
    "latitude": 41.1579,
    "longitude": -8.6291
  },
  {
    "city": "Porto Alegre",
    "latitude": -30.0346,
    "longitude": -51.2177
  },
  {
    "city": "Porto Alegre",
    "latitude": -30.03306,
    "longitude": -51.23
  },
  {
    "city": "Poznań",
    "latitude": 52.40692,
    "longitude": 16.92993
  },
  {
    "city": "Prague",
    "latitude": 50.0755,
    "longitude": 14.4378
  },
  {
    "city": "Prague",
    "latitude": 50.08804,
    "longitude": 14.42076
  },
  {
    "city": "Prescott",
    "latitude": 34.5400242,
    "longitude": -112.4685025
  },
  {
    "city": "Presov",
    "latitude": 49.16667,
    "longitude": 21.25
  },
  {
    "city": "Pretoria",
    "latitude": -25.7479,
    "longitude": 28.2293
  },
  {
    "city": "Pretoria",
    "latitude": -25.74486,
    "longitude": 28.18783
  },
  {
    "city": "Providence",
    "latitude": 41.8239891,
    "longitude": -71.4128343
  },
  {
    "city": "Province du Maniema",
    "latitude": -3,
    "longitude": 26
  },
  {
    "city": "Province of Asturias",
    "latitude": 43.36662,
    "longitude": -5.86112
  },
  {
    "city": "Province of Florence",
    "latitude": 43.83333,
    "longitude": 11.33333
  },
  {
    "city": "Província de Girona",
    "latitude": 41.98916,
    "longitude": 2.81113
  },
  {
    "city": "Provincia de Holguín",
    "latitude": 20.75,
    "longitude": -75.91667
  },
  {
    "city": "Provincia de Madrid",
    "latitude": 40.40225,
    "longitude": -3.71029
  },
  {
    "city": "Provincia de Navarra",
    "latitude": 42.8233,
    "longitude": -1.65138
  },
  {
    "city": "Provincia de Panamá",
    "latitude": 9.08333,
    "longitude": -78.9
  },
  {
    "city": "Provincia di Bergamo",
    "latitude": 45.83333,
    "longitude": 9.8
  },
  {
    "city": "Provincia di Brescia",
    "latitude": 45.70648,
    "longitude": 10.33562
  },
  {
    "city": "Provincia di Caserta",
    "latitude": 41.23333,
    "longitude": 14.16667
  },
  {
    "city": "Provincia di Como",
    "latitude": 45.91249,
    "longitude": 9.15744
  },
  {
    "city": "Provincia di Cuneo",
    "latitude": 44.51667,
    "longitude": 7.56667
  },
  {
    "city": "Provincia di Foggia",
    "latitude": 41.45,
    "longitude": 15.53333
  },
  {
    "city": "Provincia di Genova",
    "latitude": 44.5,
    "longitude": 9.06667
  },
  {
    "city": "Provincia di Lecce",
    "latitude": 40.21667,
    "longitude": 18.16667
  },
  {
    "city": "Provincia di Modena",
    "latitude": 44.5,
    "longitude": 10.9
  },
  {
    "city": "Provincia Granma",
    "latitude": 20.28333,
    "longitude": -76.86667
  },
  {
    "city": "Provincia Murillo",
    "latitude": -16.36519,
    "longitude": -68.05247
  },
  {
    "city": "Provo",
    "latitude": 40.2338438,
    "longitude": -111.6585337
  },
  {
    "city": "Puebla",
    "latitude": 19.03793,
    "longitude": -98.20346
  },
  {
    "city": "Pueblo",
    "latitude": 38.2544472,
    "longitude": -104.6091409
  },
  {
    "city": "Pune",
    "latitude": 18.51957,
    "longitude": 73.85535
  },
  {
    "city": "Puyang",
    "latitude": 29.45679,
    "longitude": 119.88872
  },
  {
    "city": "Puyang Chengguanzhen",
    "latitude": 35.70506,
    "longitude": 115.01409
  },
  {
    "city": "Puyang Shi",
    "latitude": 35.81333,
    "longitude": 115.155
  },
  {
    "city": "Pyongyang",
    "latitude": 39.0392,
    "longitude": 125.7625
  },
  {
    "city": "Pyongyang",
    "latitude": 39.03385,
    "longitude": 125.75432
  },
  {
    "city": "Qila Abdullāh District",
    "latitude": 30.69854,
    "longitude": 66.55611
  },
  {
    "city": "Qingdao",
    "latitude": 36.06488,
    "longitude": 120.38042
  },
  {
    "city": "Qinhuangdao",
    "latitude": 39.93167,
    "longitude": 119.58833
  },
  {
    "city": "Qiqihar",
    "latitude": 47.34088,
    "longitude": 123.96045
  },
  {
    "city": "Qom",
    "latitude": 34.6401,
    "longitude": 50.8764
  },
  {
    "city": "Quanzhou",
    "latitude": 24.8741,
    "longitude": 118.6759
  },
  {
    "city": "Québec",
    "latitude": 52.00017,
    "longitude": -71.99907
  },
  {
    "city": "Quetta",
    "latitude": 30.18414,
    "longitude": 67.00141
  },
  {
    "city": "Quezon City",
    "latitude": 14.676,
    "longitude": 121.0437
  },
  {
    "city": "Quezon City",
    "latitude": 14.6488,
    "longitude": 121.0509
  },
  {
    "city": "Quincy",
    "latitude": 42.2528772,
    "longitude": -71.0022705
  },
  {
    "city": "Quincy",
    "latitude": 39.9356016,
    "longitude": -91.4098726
  },
  {
    "city": "Quito",
    "latitude": -0.1807,
    "longitude": -78.4678
  },
  {
    "city": "Quito",
    "latitude": -0.22985,
    "longitude": -78.52495
  },
  {
    "city": "Ra’s Bayrūt",
    "latitude": 33.9,
    "longitude": 35.48333
  },
  {
    "city": "Rabat",
    "latitude": 34.0209,
    "longitude": -6.8416
  },
  {
    "city": "Rabat",
    "latitude": 34.01325,
    "longitude": -6.83255
  },
  {
    "city": "Racine",
    "latitude": 42.7261309,
    "longitude": -87.78285230000002
  },
  {
    "city": "Rahim Yar Khan",
    "latitude": 28.41987,
    "longitude": 70.30345
  },
  {
    "city": "Raipur",
    "latitude": 21.23333,
    "longitude": 81.63333
  },
  {
    "city": "Rājkot",
    "latitude": 22.29161,
    "longitude": 70.79322
  },
  {
    "city": "Rājshāhi",
    "latitude": 24.374,
    "longitude": 88.60114
  },
  {
    "city": "Raleigh",
    "latitude": 35.7795897,
    "longitude": -78.6381787
  },
  {
    "city": "Ranchi",
    "latitude": 23.34316,
    "longitude": 85.3094
  },
  {
    "city": "Rancho Cucamonga",
    "latitude": 34.1064,
    "longitude": -117.5931
  },
  {
    "city": "Rangoon",
    "latitude": 16.8409,
    "longitude": 96.1735
  },
  {
    "city": "Rapid City",
    "latitude": 44.0805434,
    "longitude": -103.2310149
  },
  {
    "city": "Rasht",
    "latitude": 37.27611,
    "longitude": 49.58862
  },
  {
    "city": "Rawalpindi",
    "latitude": 33.6007,
    "longitude": 73.0679
  },
  {
    "city": "Reading",
    "latitude": 40.3356483,
    "longitude": -75.9268747
  },
  {
    "city": "Recife",
    "latitude": -8.0476,
    "longitude": -34.877
  },
  {
    "city": "Recife",
    "latitude": -8.05389,
    "longitude": -34.88111
  },
  {
    "city": "Red River Delta",
    "latitude": 21.03498,
    "longitude": 105.8455
  },
  {
    "city": "Redding",
    "latitude": 40.5865396,
    "longitude": -122.3916754
  },
  {
    "city": "Regierungsbezirk Mittelfranken",
    "latitude": 49.33333,
    "longitude": 10.83333
  },
  {
    "city": "Regierungsbezirk Münster",
    "latitude": 51.9666,
    "longitude": 7.4333
  },
  {
    "city": "Región de los Llanos Centrales",
    "latitude": 8,
    "longitude": -67.75
  },
  {
    "city": "Reno",
    "latitude": 39.5296329,
    "longitude": -119.8138027
  },
  {
    "city": "Renton",
    "latitude": 47.48,
    "longitude": -122.19
  },
  {
    "city": "Republic of Burundi",
    "latitude": -3.5,
    "longitude": 30
  },
  {
    "city": "Republic of Cuba",
    "latitude": 22,
    "longitude": -79.5
  },
  {
    "city": "Republic of Cyprus",
    "latitude": 35,
    "longitude": 33
  },
  {
    "city": "Republic of Equatorial Guinea",
    "latitude": 1.7,
    "longitude": 10.5
  },
  {
    "city": "Republic of Guinea",
    "latitude": 10.83333,
    "longitude": -10.66667
  },
  {
    "city": "Republic of Panama",
    "latitude": 9,
    "longitude": -80
  },
  {
    "city": "Republic of Sierra Leone",
    "latitude": 8.5,
    "longitude": -11.5
  },
  {
    "city": "Republic of Suriname",
    "latitude": 4,
    "longitude": -56
  },
  {
    "city": "Republic of Tunisia",
    "latitude": 34,
    "longitude": 9
  },
  {
    "city": "Revere",
    "latitude": 42.4084302,
    "longitude": -71.0119948
  },
  {
    "city": "Ribeirão Preto",
    "latitude": -21.1775,
    "longitude": -47.81028
  },
  {
    "city": "Richmond",
    "latitude": 37.5407246,
    "longitude": -77.4360481
  },
  {
    "city": "Riga",
    "latitude": 56.946,
    "longitude": 24.10589
  },
  {
    "city": "Rio de Janeiro",
    "latitude": -22.25,
    "longitude": -42.5
  },
  {
    "city": "Rio de Janeiro",
    "latitude": -22.90642,
    "longitude": -43.18223
  },
  {
    "city": "Rio Grande do Sul",
    "latitude": -30,
    "longitude": -53.5
  },
  {
    "city": "Riverside",
    "latitude": 33.9533487,
    "longitude": -117.3961564
  },
  {
    "city": "Riyadh",
    "latitude": 24.7136,
    "longitude": 46.6753
  },
  {
    "city": "Riyadh",
    "latitude": 24.68773,
    "longitude": 46.72185
  },
  {
    "city": "Roanoke",
    "latitude": 37.2709704,
    "longitude": -79.9414266
  },
  {
    "city": "Rochester",
    "latitude": 43.16103,
    "longitude": -77.6109219
  },
  {
    "city": "Rochester",
    "latitude": 44.0121221,
    "longitude": -92.4801989
  },
  {
    "city": "Rock Hill",
    "latitude": 34.9248667,
    "longitude": -81.02507840000001
  },
  {
    "city": "Rockford",
    "latitude": 42.2711311,
    "longitude": -89.0939952
  },
  {
    "city": "Rockville",
    "latitude": 39.0839973,
    "longitude": -77.1527578
  },
  {
    "city": "Rocky Mount",
    "latitude": 35.9382103,
    "longitude": -77.7905339
  },
  {
    "city": "Rogers",
    "latitude": 36.3320196,
    "longitude": -94.1185366
  },
  {
    "city": "Rome",
    "latitude": 41.9028,
    "longitude": 12.4964
  },
  {
    "city": "Rome",
    "latitude": 41.89193,
    "longitude": 12.51133
  },
  {
    "city": "Rosario",
    "latitude": -32.94682,
    "longitude": -60.63932
  },
  {
    "city": "Roseville",
    "latitude": 38.7521,
    "longitude": -121.288
  },
  {
    "city": "Rostov-na-Donu",
    "latitude": 47.23135,
    "longitude": 39.72328
  },
  {
    "city": "Roswell",
    "latitude": 33.3942655,
    "longitude": -104.5230242
  },
  {
    "city": "Rotterdam",
    "latitude": 51.9244,
    "longitude": 4.4777
  },
  {
    "city": "Rotterdam",
    "latitude": 51.9225,
    "longitude": 4.47917
  },
  {
    "city": "Round Rock",
    "latitude": 30.5083,
    "longitude": -97.6789
  },
  {
    "city": "Sacramento",
    "latitude": 38.5815719,
    "longitude": -121.4943996
  },
  {
    "city": "Saga-ken",
    "latitude": 33.28904,
    "longitude": 130.11491
  },
  {
    "city": "Saginaw",
    "latitude": 43.4194699,
    "longitude": -83.9508068
  },
  {
    "city": "Şahinbey İlçesi",
    "latitude": 37.03741,
    "longitude": 37.37822
  },
  {
    "city": "Saint Petersburg",
    "latitude": 59.93863,
    "longitude": 30.31413
  },
  {
    "city": "Saitama",
    "latitude": 35.90807,
    "longitude": 139.65657
  },
  {
    "city": "Saitama-ken",
    "latitude": 35.85721,
    "longitude": 139.64904
  },
  {
    "city": "Sakai",
    "latitude": 34.58333,
    "longitude": 135.46667
  },
  {
    "city": "Sakarya",
    "latitude": 40.75,
    "longitude": 30.58333
  },
  {
    "city": "Sale",
    "latitude": 34.0531,
    "longitude": -6.79846
  },
  {
    "city": "Salem",
    "latitude": 44.9428975,
    "longitude": -123.0350963
  },
  {
    "city": "Salem",
    "latitude": 42.51954,
    "longitude": -70.8967155
  },
  {
    "city": "Salem",
    "latitude": 11.65376,
    "longitude": 78.15538
  },
  {
    "city": "Salina",
    "latitude": 38.8402805,
    "longitude": -97.61142369999999
  },
  {
    "city": "Salinas",
    "latitude": 36.6777372,
    "longitude": -121.6555013
  },
  {
    "city": "Salt Lake City",
    "latitude": 40.7607793,
    "longitude": -111.8910474
  },
  {
    "city": "Saltillo",
    "latitude": 25.42321,
    "longitude": -101.0053
  },
  {
    "city": "Salvador",
    "latitude": -12.97111,
    "longitude": -38.51083
  },
  {
    "city": "Samara",
    "latitude": 53.20007,
    "longitude": 50.15
  },
  {
    "city": "Samsun",
    "latitude": 41.25,
    "longitude": 36.33333
  },
  {
    "city": "San Angelo",
    "latitude": 31.4637723,
    "longitude": -100.4370375
  },
  {
    "city": "San Antonio",
    "latitude": 29.4241219,
    "longitude": -98.49362819999999
  },
  {
    "city": "San Diego",
    "latitude": 32.715738,
    "longitude": -117.1610838
  },
  {
    "city": "San Francisco",
    "latitude": 37.7749295,
    "longitude": -122.4194155
  },
  {
    "city": "San Jose",
    "latitude": 37.3382082,
    "longitude": -121.8863286
  },
  {
    "city": "San Luis Potosí",
    "latitude": 22.14982,
    "longitude": -100.97916
  },
  {
    "city": "San Mateo",
    "latitude": 37.56,
    "longitude": -122.31
  },
  {
    "city": "San Miguel de Tucumán",
    "latitude": -26.82414,
    "longitude": -65.2226
  },
  {
    "city": "Sanaa",
    "latitude": 15.3694,
    "longitude": 44.191
  },
  {
    "city": "Sanaa",
    "latitude": 15.35472,
    "longitude": 44.20667
  },
  {
    "city": "Sanaʽa",
    "latitude": 15.3694,
    "longitude": 44.191
  },
  {
    "city": "Sandy Springs",
    "latitude": 33.93,
    "longitude": -84.37
  },
  {
    "city": "Sāngli",
    "latitude": 16.85438,
    "longitude": 74.56417
  },
  {
    "city": "Santa Ana",
    "latitude": 33.7455,
    "longitude": -117.8677
  },
  {
    "city": "Santa Barbara",
    "latitude": 34.4208305,
    "longitude": -119.6981901
  },
  {
    "city": "Santa Catarina",
    "latitude": -27,
    "longitude": -50
  },
  {
    "city": "Santa Clara",
    "latitude": 37.36,
    "longitude": -121.97
  },
  {
    "city": "Santa Clarita",
    "latitude": 34.3917,
    "longitude": -118.5426
  },
  {
    "city": "Santa Cruz",
    "latitude": -17.7833,
    "longitude": -63.1821
  },
  {
    "city": "Santa Cruz de la Sierra",
    "latitude": -17.78629,
    "longitude": -63.18117
  },
  {
    "city": "Santa Fe",
    "latitude": 35.6869752,
    "longitude": -105.937799
  },
  {
    "city": "Santa Maria",
    "latitude": 34.9530337,
    "longitude": -120.4357191
  },
  {
    "city": "Santa Monica",
    "latitude": 34.02,
    "longitude": -118.48
  },
  {
    "city": "Santa Rosa",
    "latitude": 38.440429,
    "longitude": -122.7140548
  },
  {
    "city": "Santiago",
    "latitude": -33.4489,
    "longitude": -70.6693
  },
  {
    "city": "Santiago",
    "latitude": -33.45694,
    "longitude": -70.64827
  },
  {
    "city": "Santiago de los Caballeros",
    "latitude": 19.4517,
    "longitude": -70.69703
  },
  {
    "city": "Santiago de Querétaro",
    "latitude": 20.58806,
    "longitude": -100.38806
  },
  {
    "city": "Santo André",
    "latitude": -23.66389,
    "longitude": -46.53833
  },
  {
    "city": "Santo Domingo",
    "latitude": 18.4861,
    "longitude": -69.9312
  },
  {
    "city": "Santo Domingo",
    "latitude": 18.47186,
    "longitude": -69.89232
  },
  {
    "city": "Santo Domingo Este",
    "latitude": 18.48847,
    "longitude": -69.85707
  },
  {
    "city": "Santo Domingo Oeste",
    "latitude": 18.5,
    "longitude": -70
  },
  {
    "city": "São Bernardo do Campo",
    "latitude": -23.69389,
    "longitude": -46.565
  },
  {
    "city": "São José dos Campos",
    "latitude": -23.17944,
    "longitude": -45.88694
  },
  {
    "city": "São Luís",
    "latitude": -2.52972,
    "longitude": -44.30278
  },
  {
    "city": "São Paulo",
    "latitude": -23.5505,
    "longitude": -46.6333
  },
  {
    "city": "São Paulo",
    "latitude": -22,
    "longitude": -49
  },
  {
    "city": "São Paulo",
    "latitude": -23.5475,
    "longitude": -46.63611
  },
  {
    "city": "Sapporo",
    "latitude": 43.06667,
    "longitude": 141.35
  },
  {
    "city": "Sarajevo",
    "latitude": 43.84864,
    "longitude": 18.35644
  },
  {
    "city": "Saratov",
    "latitude": 51.54056,
    "longitude": 46.00861
  },
  {
    "city": "Savannah",
    "latitude": 32.0835407,
    "longitude": -81.09983419999999
  },
  {
    "city": "Scarborough",
    "latitude": 43.77223,
    "longitude": -79.25666
  },
  {
    "city": "Scottsdale",
    "latitude": 33.4942,
    "longitude": -111.9261
  },
  {
    "city": "Scranton",
    "latitude": 41.408969,
    "longitude": -75.66241219999999
  },
  {
    "city": "Seattle",
    "latitude": 47.6062095,
    "longitude": -122.3320708
  },
  {
    "city": "Secondi Takoradi",
    "latitude": 4.93473,
    "longitude": -1.71378
  },
  {
    "city": "Semarang",
    "latitude": -6.99306,
    "longitude": 110.42083
  },
  {
    "city": "Sendai",
    "latitude": 38.26667,
    "longitude": 140.86667
  },
  {
    "city": "Seongnam-si",
    "latitude": 37.43861,
    "longitude": 127.13778
  },
  {
    "city": "Seoul",
    "latitude": 37.5665,
    "longitude": 126.978
  },
  {
    "city": "Seoul",
    "latitude": 37.566,
    "longitude": 126.9784
  },
  {
    "city": "Sergipe",
    "latitude": -10.5,
    "longitude": -37.33333
  },
  {
    "city": "Sevilla",
    "latitude": 37.38283,
    "longitude": -5.97317
  },
  {
    "city": "Seville",
    "latitude": 37.3891,
    "longitude": -5.9845
  },
  {
    "city": "Seville",
    "latitude": 37.39141,
    "longitude": -5.95918
  },
  {
    "city": "Shanghai",
    "latitude": 31.2304,
    "longitude": 121.4737
  },
  {
    "city": "Shanghai",
    "latitude": 31.22222,
    "longitude": 121.45806
  },
  {
    "city": "Shangyu",
    "latitude": 30.01556,
    "longitude": 120.87111
  },
  {
    "city": "Shantou",
    "latitude": 23.36814,
    "longitude": 116.71479
  },
  {
    "city": "Shaoguan",
    "latitude": 24.8,
    "longitude": 113.58333
  },
  {
    "city": "Shapingba Qu",
    "latitude": 29.63286,
    "longitude": 106.36708
  },
  {
    "city": "Sharjah",
    "latitude": 25.3463,
    "longitude": 55.4209
  },
  {
    "city": "Sheboygan",
    "latitude": 43.7508284,
    "longitude": -87.71453
  },
  {
    "city": "Sheffield",
    "latitude": 53.3811,
    "longitude": -1.4701
  },
  {
    "city": "Sheffield",
    "latitude": 53.38297,
    "longitude": -1.4659
  },
  {
    "city": "Sheffield",
    "latitude": 53.41667,
    "longitude": -1.5
  },
  {
    "city": "Shenyang",
    "latitude": 41.8057,
    "longitude": 123.4315
  },
  {
    "city": "Shenyang",
    "latitude": 41.79222,
    "longitude": 123.43278
  },
  {
    "city": "Shenzhen",
    "latitude": 22.5431,
    "longitude": 114.0579
  },
  {
    "city": "Shenzhen",
    "latitude": 22.54554,
    "longitude": 114.0683
  },
  {
    "city": "Shihezi",
    "latitude": 44.3023,
    "longitude": 86.03694
  },
  {
    "city": "Shijiazhuang",
    "latitude": 38.04139,
    "longitude": 114.47861
  },
  {
    "city": "Shiraz",
    "latitude": 29.61031,
    "longitude": 52.53113
  },
  {
    "city": "Shivaji Nagar",
    "latitude": 18.53017,
    "longitude": 73.85263
  },
  {
    "city": "Shiyan",
    "latitude": 32.6475,
    "longitude": 110.77806
  },
  {
    "city": "Shizuoka",
    "latitude": 34.98333,
    "longitude": 138.38333
  },
  {
    "city": "Shreveport",
    "latitude": 32.5251516,
    "longitude": -93.7501789
  },
  {
    "city": "Shuangyashan",
    "latitude": 46.63611,
    "longitude": 131.15389
  },
  {
    "city": "Siguiri Prefecture",
    "latitude": 11.66667,
    "longitude": -9.5
  },
  {
    "city": "Simi Valley",
    "latitude": 34.27,
    "longitude": -118.75
  },
  {
    "city": "Singapore",
    "latitude": 1.3521,
    "longitude": 103.8198
  },
  {
    "city": "Singapore",
    "latitude": 1.28967,
    "longitude": 103.85007
  },
  {
    "city": "Sioux City",
    "latitude": 42.4999942,
    "longitude": -96.40030689999999
  },
  {
    "city": "Sioux Falls",
    "latitude": 43.5445959,
    "longitude": -96.73110340000001
  },
  {
    "city": "Situbondo",
    "latitude": -7.70623,
    "longitude": 114.00976
  },
  {
    "city": "Skopje",
    "latitude": 42,
    "longitude": 21.41667
  },
  {
    "city": "Slovak Republic",
    "latitude": 48.66667,
    "longitude": 19.5
  },
  {
    "city": "Sofia",
    "latitude": 42.69751,
    "longitude": 23.32415
  },
  {
    "city": "Sokoto",
    "latitude": 13.06269,
    "longitude": 5.24322
  },
  {
    "city": "Solāpur",
    "latitude": 17.67152,
    "longitude": 75.91044
  },
  {
    "city": "Somalia",
    "latitude": 6,
    "longitude": 48
  },
  {
    "city": "Somerville",
    "latitude": 42.3875968,
    "longitude": -71.0994968
  },
  {
    "city": "South Bend",
    "latitude": 41.6763545,
    "longitude": -86.25198979999999
  },
  {
    "city": "South Central Coast",
    "latitude": 13.81674,
    "longitude": 109.05029
  },
  {
    "city": "South Sudan",
    "latitude": 7.5,
    "longitude": 30
  },
  {
    "city": "South Tangerang",
    "latitude": -6.28862,
    "longitude": 106.71789
  },
  {
    "city": "Southaven",
    "latitude": 34.9889818,
    "longitude": -90.0125913
  },
  {
    "city": "Southeast",
    "latitude": 10.75053,
    "longitude": 106.7505
  },
  {
    "city": "Southern Province",
    "latitude": 7.8,
    "longitude": -12
  },
  {
    "city": "Soweto",
    "latitude": -26.26781,
    "longitude": 27.85849
  },
  {
    "city": "Sparks",
    "latitude": 39.5349,
    "longitude": -119.7527
  },
  {
    "city": "Spartanburg",
    "latitude": 34.9495672,
    "longitude": -81.9320482
  },
  {
    "city": "Spokane",
    "latitude": 47.6587802,
    "longitude": -117.4260466
  },
  {
    "city": "Spokane Valley",
    "latitude": 47.66,
    "longitude": -117.23
  },
  {
    "city": "Springdale",
    "latitude": 36.18674420000001,
    "longitude": -94.1288141
  },
  {
    "city": "Springfield",
    "latitude": 37.2089572,
    "longitude": -93.29229889999999
  },
  {
    "city": "Springfield",
    "latitude": 42.1014831,
    "longitude": -72.589811
  },
  {
    "city": "Springfield",
    "latitude": 39.78172130000001,
    "longitude": -89.6501481
  },
  {
    "city": "Srinagar",
    "latitude": 34.08565,
    "longitude": 74.80555
  },
  {
    "city": "St. Cloud",
    "latitude": 45.5579451,
    "longitude": -94.16324039999999
  },
  {
    "city": "St. George",
    "latitude": 37.0965278,
    "longitude": -113.5684164
  },
  {
    "city": "St. Joseph",
    "latitude": 39.7674578,
    "longitude": -94.84668099999999
  },
  {
    "city": "St. Louis",
    "latitude": 38.6270025,
    "longitude": -90.19940419999999
  },
  {
    "city": "St. Paul",
    "latitude": 44.9537029,
    "longitude": -93.0899578
  },
  {
    "city": "St. Petersburg",
    "latitude": 27.7676,
    "longitude": -82.6403
  },
  {
    "city": "Stamford",
    "latitude": 41.0534302,
    "longitude": -73.5387341
  },
  {
    "city": "State College",
    "latitude": 40.7933949,
    "longitude": -77.8600012
  },
  {
    "city": "State of New South Wales",
    "latitude": -33,
    "longitude": 146
  },
  {
    "city": "State of Queensland",
    "latitude": -20,
    "longitude": 145
  },
  {
    "city": "Sterling Heights",
    "latitude": 42.58,
    "longitude": -83.03
  },
  {
    "city": "Stillwater",
    "latitude": 36.1156071,
    "longitude": -97.0583681
  },
  {
    "city": "Stockholm",
    "latitude": 59.3293,
    "longitude": 18.0686
  },
  {
    "city": "Stockholm",
    "latitude": 59.33258,
    "longitude": 18.0649
  },
  {
    "city": "Stockton",
    "latitude": 37.9577016,
    "longitude": -121.2907796
  },
  {
    "city": "Stuttgart",
    "latitude": 48.78232,
    "longitude": 9.17702
  },
  {
    "city": "Subang Jaya",
    "latitude": 3.04384,
    "longitude": 101.58062
  },
  {
    "city": "Suffolk",
    "latitude": 36.7,
    "longitude": -76.63
  },
  {
    "city": "Sulţānah",
    "latitude": 24.49258,
    "longitude": 39.58572
  },
  {
    "city": "Sumter",
    "latitude": 33.9204354,
    "longitude": -80.3414693
  },
  {
    "city": "Sunnyvale",
    "latitude": 37.3688,
    "longitude": -122.0363
  },
  {
    "city": "Sunrise",
    "latitude": 26.166,
    "longitude": -80.2566
  },
  {
    "city": "Surabaya",
    "latitude": -7.24917,
    "longitude": 112.75083
  },
  {
    "city": "Sūrat",
    "latitude": 21.19594,
    "longitude": 72.83023
  },
  {
    "city": "Surprise",
    "latitude": 33.6292,
    "longitude": -112.3679
  },
  {
    "city": "Suwon",
    "latitude": 37.29111,
    "longitude": 127.00889
  },
  {
    "city": "Suzhou",
    "latitude": 31.2989,
    "longitude": 120.5853
  },
  {
    "city": "Suzhou",
    "latitude": 31.30408,
    "longitude": 120.59538
  },
  {
    "city": "Sydney",
    "latitude": -33.8688,
    "longitude": 151.2093
  },
  {
    "city": "Sydney",
    "latitude": -33.86785,
    "longitude": 151.20732
  },
  {
    "city": "Syracuse",
    "latitude": 43.0481221,
    "longitude": -76.14742439999999
  },
  {
    "city": "Ta‘izz",
    "latitude": 13.57952,
    "longitude": 44.02091
  },
  {
    "city": "Tabriz",
    "latitude": 38.08,
    "longitude": 46.2919
  },
  {
    "city": "Tacoma",
    "latitude": 47.2529,
    "longitude": -122.4443
  },
  {
    "city": "Taguig",
    "latitude": 14.5243,
    "longitude": 121.0792
  },
  {
    "city": "Tai’an",
    "latitude": 36.18528,
    "longitude": 117.12
  },
  {
    "city": "Taichung",
    "latitude": 24.1469,
    "longitude": 120.6839
  },
  {
    "city": "Tainan",
    "latitude": 22.99083,
    "longitude": 120.21333
  },
  {
    "city": "Taipei",
    "latitude": 25.033,
    "longitude": 121.5654
  },
  {
    "city": "Taipei",
    "latitude": 25.04776,
    "longitude": 121.53185
  },
  {
    "city": "Taiyuan",
    "latitude": 37.86944,
    "longitude": 112.56028
  },
  {
    "city": "Taizhou",
    "latitude": 32.49069,
    "longitude": 119.90812
  },
  {
    "city": "Takeo",
    "latitude": 10.99081,
    "longitude": 104.78498
  },
  {
    "city": "Tallahassee",
    "latitude": 30.4382559,
    "longitude": -84.28073289999999
  },
  {
    "city": "Tampa",
    "latitude": 27.950575,
    "longitude": -82.4571776
  },
  {
    "city": "Tandjile Region",
    "latitude": 9.5,
    "longitude": 16.5
  },
  {
    "city": "Tangerang",
    "latitude": -6.17806,
    "longitude": 106.63
  },
  {
    "city": "Tangier",
    "latitude": 35.7595,
    "longitude": -5.834
  },
  {
    "city": "Tangier",
    "latitude": 35.76727,
    "longitude": -5.79975
  },
  {
    "city": "Tangshan",
    "latitude": 39.63333,
    "longitude": 118.18333
  },
  {
    "city": "Tashkent",
    "latitude": 41.2995,
    "longitude": 69.2401
  },
  {
    "city": "Tashkent",
    "latitude": 41.26465,
    "longitude": 69.21627
  },
  {
    "city": "Taunton",
    "latitude": 41.900101,
    "longitude": -71.0897674
  },
  {
    "city": "Tbilisi",
    "latitude": 41.7151,
    "longitude": 44.8271
  },
  {
    "city": "Tbilisi",
    "latitude": 41.69411,
    "longitude": 44.83368
  },
  {
    "city": "Tébessa",
    "latitude": 35.40417,
    "longitude": 8.12417
  },
  {
    "city": "Tegucigalpa",
    "latitude": 14.0818,
    "longitude": -87.20681
  },
  {
    "city": "Tehran",
    "latitude": 35.6892,
    "longitude": 51.389
  },
  {
    "city": "Tehran",
    "latitude": 35.69439,
    "longitude": 51.42151
  },
  {
    "city": "Tekirdağ",
    "latitude": 41,
    "longitude": 27.5
  },
  {
    "city": "Temecula",
    "latitude": 33.4936391,
    "longitude": -117.1483648
  },
  {
    "city": "Tempe",
    "latitude": 33.39,
    "longitude": -111.93
  },
  {
    "city": "Temple",
    "latitude": 31.0982344,
    "longitude": -97.342782
  },
  {
    "city": "Teni",
    "latitude": 10.01115,
    "longitude": 77.47772
  },
  {
    "city": "Teresina",
    "latitude": -5.08917,
    "longitude": -42.80194
  },
  {
    "city": "Terre Haute",
    "latitude": 39.4667034,
    "longitude": -87.41390919999999
  },
  {
    "city": "Texarkana",
    "latitude": 33.425125,
    "longitude": -94.04768820000001
  },
  {
    "city": "Thāne",
    "latitude": 19.19704,
    "longitude": 72.96355
  },
  {
    "city": "The Hague",
    "latitude": 52.0705,
    "longitude": 4.3007
  },
  {
    "city": "Thiruvananthapuram",
    "latitude": 8.4855,
    "longitude": 76.94924
  },
  {
    "city": "Thornton",
    "latitude": 39.92,
    "longitude": -104.94
  },
  {
    "city": "Thousand Oaks",
    "latitude": 34.19,
    "longitude": -118.87
  },
  {
    "city": "Tianjin",
    "latitude": 39.3434,
    "longitude": 117.3616
  },
  {
    "city": "Tianjin",
    "latitude": 39.14222,
    "longitude": 117.17667
  },
  {
    "city": "Tianshui",
    "latitude": 34.57952,
    "longitude": 105.74238
  },
  {
    "city": "Tijuana",
    "latitude": 32.5027,
    "longitude": -117.00371
  },
  {
    "city": "Tỉnh Hòa Bình",
    "latitude": 20.66667,
    "longitude": 105.33333
  },
  {
    "city": "Tỉnh Phú Yên",
    "latitude": 13.16667,
    "longitude": 109.08333
  },
  {
    "city": "Tỉnh Quảng Bình",
    "latitude": 17.5,
    "longitude": 106.33333
  },
  {
    "city": "Tỉnh Quảng Ngãi",
    "latitude": 15,
    "longitude": 108.66667
  },
  {
    "city": "Tỉnh Quảng Ninh",
    "latitude": 21.25,
    "longitude": 107.33333
  },
  {
    "city": "Tỉnh Quảng Trị",
    "latitude": 16.75,
    "longitude": 107
  },
  {
    "city": "Tỉnh Sơn La",
    "latitude": 21.16667,
    "longitude": 104
  },
  {
    "city": "Tỉnh Tây Ninh",
    "latitude": 11.33333,
    "longitude": 106.16667
  },
  {
    "city": "Tỉnh Thái Bình",
    "latitude": 20.5,
    "longitude": 106.36667
  },
  {
    "city": "Tỉnh Thanh Hóa",
    "latitude": 20.06667,
    "longitude": 105.33333
  },
  {
    "city": "Tỉnh Thừa Thiên-Huế",
    "latitude": 16.33333,
    "longitude": 107.58333
  },
  {
    "city": "Tỉnh Tiền Giang",
    "latitude": 10.4,
    "longitude": 106.3
  },
  {
    "city": "Tiruchirappalli",
    "latitude": 10.8155,
    "longitude": 78.69651
  },
  {
    "city": "Tirunelveli",
    "latitude": 8.72742,
    "longitude": 77.6838
  },
  {
    "city": "Tlalnepantla",
    "latitude": 19.54005,
    "longitude": -99.19538
  },
  {
    "city": "Tlalpan",
    "latitude": 19.29513,
    "longitude": -99.16206
  },
  {
    "city": "Tokat",
    "latitude": 40.41667,
    "longitude": 36.58333
  },
  {
    "city": "Tokyo",
    "latitude": 35.6895,
    "longitude": 139.6917
  },
  {
    "city": "Tokyo",
    "latitude": 35.6895,
    "longitude": 139.69171
  },
  {
    "city": "Tol’yatti",
    "latitude": 53.5303,
    "longitude": 49.3461
  },
  {
    "city": "Toledo",
    "latitude": 41.6639383,
    "longitude": -83.55521200000001
  },
  {
    "city": "Tongshan",
    "latitude": 34.18045,
    "longitude": 117.15707
  },
  {
    "city": "Topeka",
    "latitude": 39.0558235,
    "longitude": -95.68901849999999
  },
  {
    "city": "Toronto",
    "latitude": 43.65107,
    "longitude": -79.347015
  },
  {
    "city": "Toronto",
    "latitude": 43.70011,
    "longitude": -79.4163
  },
  {
    "city": "Toronto county",
    "latitude": 43.69655,
    "longitude": -79.42909
  },
  {
    "city": "Torrance",
    "latitude": 33.83,
    "longitude": -118.36
  },
  {
    "city": "Trabzon",
    "latitude": 40.86946,
    "longitude": 39.81255
  },
  {
    "city": "Trencin",
    "latitude": 48.83333,
    "longitude": 18.25
  },
  {
    "city": "Trenton",
    "latitude": 40.2170534,
    "longitude": -74.7429384
  },
  {
    "city": "Tripoli",
    "latitude": 32.87519,
    "longitude": 13.18746
  },
  {
    "city": "Trujillo",
    "latitude": -8.11599,
    "longitude": -79.02998
  },
  {
    "city": "Tucson",
    "latitude": 32.2217429,
    "longitude": -110.926479
  },
  {
    "city": "Tulsa",
    "latitude": 36.1539816,
    "longitude": -95.99277500000001
  },
  {
    "city": "Tunis",
    "latitude": 36.8065,
    "longitude": 10.1815
  },
  {
    "city": "Tunis",
    "latitude": 36.81897,
    "longitude": 10.16579
  },
  {
    "city": "Turin",
    "latitude": 45.07049,
    "longitude": 7.68682
  },
  {
    "city": "Tuscaloosa",
    "latitude": 33.2098407,
    "longitude": -87.56917349999999
  },
  {
    "city": "Twin Falls",
    "latitude": 42.5629668,
    "longitude": -114.4608711
  },
  {
    "city": "Tyler",
    "latitude": 32.3512601,
    "longitude": -95.30106239999999
  },
  {
    "city": "Uberlândia",
    "latitude": -18.91861,
    "longitude": -48.27722
  },
  {
    "city": "Ufa",
    "latitude": 54.74306,
    "longitude": 55.96779
  },
  {
    "city": "Ulaanbaatar",
    "latitude": 47.8864,
    "longitude": 106.9057
  },
  {
    "city": "Ulan Bator",
    "latitude": 47.90771,
    "longitude": 106.88324
  },
  {
    "city": "Ulsan",
    "latitude": 35.53722,
    "longitude": 129.31667
  },
  {
    "city": "Ulyanovsk",
    "latitude": 54.32824,
    "longitude": 48.38657
  },
  {
    "city": "Umraniye",
    "latitude": 41.01643,
    "longitude": 29.12476
  },
  {
    "city": "Unity",
    "latitude": 8.65,
    "longitude": 29.85
  },
  {
    "city": "Upper Nile",
    "latitude": 10,
    "longitude": 32.7
  },
  {
    "city": "Ürümqi",
    "latitude": 43.80096,
    "longitude": 87.60046
  },
  {
    "city": "Üsküdar",
    "latitude": 41.02252,
    "longitude": 29.02369
  },
  {
    "city": "Utica",
    "latitude": 43.100903,
    "longitude": -75.232664
  },
  {
    "city": "Vacaville",
    "latitude": 38.36,
    "longitude": -121.97
  },
  {
    "city": "Vadodara",
    "latitude": 22.29941,
    "longitude": 73.20812
  },
  {
    "city": "Valdosta",
    "latitude": 30.8327022,
    "longitude": -83.2784851
  },
  {
    "city": "Valencia",
    "latitude": 39.4699,
    "longitude": -0.3763
  },
  {
    "city": "Valencia",
    "latitude": 10.16202,
    "longitude": -68.00765
  },
  {
    "city": "Valencia",
    "latitude": 39.46975,
    "longitude": -0.37739
  },
  {
    "city": "Valencia",
    "latitude": 39.45612,
    "longitude": -0.35457
  },
  {
    "city": "Vallejo",
    "latitude": 38.11,
    "longitude": -122.26
  },
  {
    "city": "Vancouver",
    "latitude": 45.6387281,
    "longitude": -122.6614861
  },
  {
    "city": "Vancouver",
    "latitude": 49.2827,
    "longitude": -123.1207
  },
  {
    "city": "Vancouver",
    "latitude": 49.24966,
    "longitude": -123.11934
  },
  {
    "city": "Varanasi",
    "latitude": 25.31668,
    "longitude": 83.01041
  },
  {
    "city": "Ventura",
    "latitude": 34.27,
    "longitude": -119.25
  },
  {
    "city": "Veracruz",
    "latitude": 19.18095,
    "longitude": -96.1429
  },
  {
    "city": "Victoria",
    "latitude": 28.8052674,
    "longitude": -97.0035982
  },
  {
    "city": "Victorville",
    "latitude": 34.5361,
    "longitude": -117.2912
  },
  {
    "city": "Vienna",
    "latitude": 48.2082,
    "longitude": 16.3738
  },
  {
    "city": "Vienna",
    "latitude": 48.20849,
    "longitude": 16.37208
  },
  {
    "city": "Vientiane",
    "latitude": 17.9757,
    "longitude": 102.6331
  },
  {
    "city": "Vijayawada",
    "latitude": 16.50745,
    "longitude": 80.6466
  },
  {
    "city": "Vineland",
    "latitude": 39.4863773,
    "longitude": -75.02596369999999
  },
  {
    "city": "Virginia Beach",
    "latitude": 36.8529263,
    "longitude": -75.97798499999999
  },
  {
    "city": "Visakhapatnam",
    "latitude": 17.68009,
    "longitude": 83.20161
  },
  {
    "city": "Visalia",
    "latitude": 36.3302,
    "longitude": -119.2921
  },
  {
    "city": "Vladimirskaya Oblast’",
    "latitude": 56,
    "longitude": 40.5
  },
  {
    "city": "Vladivostok",
    "latitude": 43.10562,
    "longitude": 131.87353
  },
  {
    "city": "Volgograd",
    "latitude": 48.71939,
    "longitude": 44.50183
  },
  {
    "city": "Voronezh",
    "latitude": 51.67204,
    "longitude": 39.1843
  },
  {
    "city": "Waco",
    "latitude": 31.549333,
    "longitude": -97.1466695
  },
  {
    "city": "Waltham",
    "latitude": 42.3764852,
    "longitude": -71.2356113
  },
  {
    "city": "Warrap State",
    "latitude": 8,
    "longitude": 28.85
  },
  {
    "city": "Warren",
    "latitude": 42.5145,
    "longitude": -83.0147
  },
  {
    "city": "Warren",
    "latitude": 41.2375569,
    "longitude": -80.81841659999999
  },
  {
    "city": "Warsaw",
    "latitude": 52.2297,
    "longitude": 21.0122
  },
  {
    "city": "Warsaw",
    "latitude": 52.22977,
    "longitude": 21.01178
  },
  {
    "city": "Washington",
    "latitude": 38.9071923,
    "longitude": -77.0368707
  },
  {
    "city": "Waterbury",
    "latitude": 41.5581525,
    "longitude": -73.0514965
  },
  {
    "city": "Waterloo",
    "latitude": 42.492786,
    "longitude": -92.34257749999999
  },
  {
    "city": "Waukesha",
    "latitude": 43.0116784,
    "longitude": -88.2314813
  },
  {
    "city": "Wausau",
    "latitude": 44.9591352,
    "longitude": -89.6301221
  },
  {
    "city": "Wauwatosa",
    "latitude": 43.0494572,
    "longitude": -88.0075875
  },
  {
    "city": "Wellington",
    "latitude": -41.2865,
    "longitude": 174.7762
  },
  {
    "city": "Wenzhou",
    "latitude": 27.99942,
    "longitude": 120.66682
  },
  {
    "city": "West Allis",
    "latitude": 43.0166806,
    "longitude": -88.0070315
  },
  {
    "city": "West Coast",
    "latitude": 13.23333,
    "longitude": -16.35
  },
  {
    "city": "West Covina",
    "latitude": 34.06,
    "longitude": -117.91
  },
  {
    "city": "West Palm Beach",
    "latitude": 26.7153424,
    "longitude": -80.0533746
  },
  {
    "city": "West Valley City",
    "latitude": 40.69,
    "longitude": -112.01
  },
  {
    "city": "Western Area",
    "latitude": 8.33333,
    "longitude": -13.11667
  },
  {
    "city": "Western Equatoria",
    "latitude": 5.4,
    "longitude": 28.4
  },
  {
    "city": "Western Region",
    "latitude": 10.01211,
    "longitude": 105.83224
  },
  {
    "city": "Westfield",
    "latitude": 42.1250929,
    "longitude": -72.749538
  },
  {
    "city": "Westminster",
    "latitude": 39.88,
    "longitude": -105.06
  },
  {
    "city": "Weston",
    "latitude": 26.1003654,
    "longitude": -80.3997748
  },
  {
    "city": "Weymouth Town",
    "latitude": 42.2180724,
    "longitude": -70.94103559999999
  },
  {
    "city": "Wichita",
    "latitude": 37.688889,
    "longitude": -97.336111
  },
  {
    "city": "Wichita Falls",
    "latitude": 33.9137085,
    "longitude": -98.4933873
  },
  {
    "city": "Wilmington",
    "latitude": 34.2257255,
    "longitude": -77.9447102
  },
  {
    "city": "Wilmington",
    "latitude": 39.7390721,
    "longitude": -75.5397878
  },
  {
    "city": "Wilson",
    "latitude": 35.7212689,
    "longitude": -77.9155395
  },
  {
    "city": "Windhoek",
    "latitude": -22.5609,
    "longitude": 17.0658
  },
  {
    "city": "Winnipeg",
    "latitude": 49.8951,
    "longitude": -97.1384
  },
  {
    "city": "Winnipeg",
    "latitude": 49.8844,
    "longitude": -97.14704
  },
  {
    "city": "Winston-Salem",
    "latitude": 36.0999,
    "longitude": -80.2442
  },
  {
    "city": "Woburn",
    "latitude": 42.4792618,
    "longitude": -71.1522765
  },
  {
    "city": "Woodbridge",
    "latitude": 40.56,
    "longitude": -74.29
  },
  {
    "city": "Worcester",
    "latitude": 42.2625932,
    "longitude": -71.8022934
  },
  {
    "city": "Wrocław",
    "latitude": 51.1,
    "longitude": 17.03333
  },
  {
    "city": "Wuhan",
    "latitude": 30.5928,
    "longitude": 114.3055
  },
  {
    "city": "Wuhan",
    "latitude": 30.58333,
    "longitude": 114.26667
  },
  {
    "city": "Wuxi",
    "latitude": 31.56887,
    "longitude": 120.28857
  },
  {
    "city": "Xi’an",
    "latitude": 34.25833,
    "longitude": 108.92861
  },
  {
    "city": "Xiamen",
    "latitude": 24.47979,
    "longitude": 118.08187
  },
  {
    "city": "Xian",
    "latitude": 34.3416,
    "longitude": 108.9398
  },
  {
    "city": "Xiangtan",
    "latitude": 27.85,
    "longitude": 112.9
  },
  {
    "city": "Xianyang",
    "latitude": 34.33778,
    "longitude": 108.70261
  },
  {
    "city": "Xingtai",
    "latitude": 37.06306,
    "longitude": 114.49417
  },
  {
    "city": "Xining",
    "latitude": 36.62554,
    "longitude": 101.75739
  },
  {
    "city": "Xinxiang",
    "latitude": 35.19033,
    "longitude": 113.80151
  },
  {
    "city": "Xinyang",
    "latitude": 32.12278,
    "longitude": 114.06556
  },
  {
    "city": "Xuchang",
    "latitude": 34.03189,
    "longitude": 113.86299
  },
  {
    "city": "Yakima",
    "latitude": 46.6020711,
    "longitude": -120.5058987
  },
  {
    "city": "Yancheng",
    "latitude": 33.3575,
    "longitude": 120.1573
  },
  {
    "city": "Yangon",
    "latitude": 16.80528,
    "longitude": 96.15611
  },
  {
    "city": "Yantai",
    "latitude": 37.47649,
    "longitude": 121.44081
  },
  {
    "city": "Yaoundé",
    "latitude": 3.848,
    "longitude": 11.5021
  },
  {
    "city": "Yaoundé",
    "latitude": 3.86667,
    "longitude": 11.51667
  },
  {
    "city": "Yaroslavl",
    "latitude": 57.62987,
    "longitude": 39.87368
  },
  {
    "city": "Yekaterinburg",
    "latitude": 56.8519,
    "longitude": 60.6122
  },
  {
    "city": "Yerevan",
    "latitude": 40.1792,
    "longitude": 44.4991
  },
  {
    "city": "Yerevan",
    "latitude": 40.18111,
    "longitude": 44.51361
  },
  {
    "city": "Yingkou",
    "latitude": 40.66482,
    "longitude": 122.22833
  },
  {
    "city": "Yogyakarta",
    "latitude": -7.80139,
    "longitude": 110.36472
  },
  {
    "city": "Yokohama",
    "latitude": 35.43333,
    "longitude": 139.65
  },
  {
    "city": "Yonkers",
    "latitude": 40.9312,
    "longitude": -73.8988
  },
  {
    "city": "Yono",
    "latitude": 35.88333,
    "longitude": 139.63333
  },
  {
    "city": "York",
    "latitude": 39.9625984,
    "longitude": -76.727745
  },
  {
    "city": "York",
    "latitude": 44.00011,
    "longitude": -79.46632
  },
  {
    "city": "Youngstown",
    "latitude": 41.0997803,
    "longitude": -80.6495194
  },
  {
    "city": "Yubei District",
    "latitude": 29.81378,
    "longitude": 106.74352
  },
  {
    "city": "Yueyang",
    "latitude": 29.37455,
    "longitude": 113.09481
  },
  {
    "city": "Yuma",
    "latitude": 32.6926512,
    "longitude": -114.6276916
  },
  {
    "city": "Yunfu",
    "latitude": 22.92833,
    "longitude": 112.03954
  },
  {
    "city": "Zagreb",
    "latitude": 45.81444,
    "longitude": 15.97798
  },
  {
    "city": "Zapopan",
    "latitude": 20.72356,
    "longitude": -103.38479
  },
  {
    "city": "Zaporizhia",
    "latitude": 47.82289,
    "longitude": 35.19031
  },
  {
    "city": "Zaragoza",
    "latitude": 41.6488,
    "longitude": -0.8891
  },
  {
    "city": "Zaragoza",
    "latitude": 41.64829,
    "longitude": -0.88303
  },
  {
    "city": "Zaragoza",
    "latitude": 41.65606,
    "longitude": -0.87734
  },
  {
    "city": "Zaria",
    "latitude": 11.11128,
    "longitude": 7.7227
  },
  {
    "city": "Zarqa",
    "latitude": 32.07275,
    "longitude": 36.08796
  },
  {
    "city": "Zhangjiakou",
    "latitude": 40.81,
    "longitude": 114.87944
  },
  {
    "city": "Zhangzhou",
    "latitude": 24.51333,
    "longitude": 117.65556
  },
  {
    "city": "Zhanjiang",
    "latitude": 21.28145,
    "longitude": 110.34271
  },
  {
    "city": "Zhengzhou",
    "latitude": 34.7466,
    "longitude": 113.6254
  },
  {
    "city": "Zhengzhou",
    "latitude": 34.75778,
    "longitude": 113.64861
  },
  {
    "city": "Zhenjiang",
    "latitude": 32.21086,
    "longitude": 119.45508
  },
  {
    "city": "Zhongshan",
    "latitude": 21.31992,
    "longitude": 110.5723
  },
  {
    "city": "Zhu Cheng City",
    "latitude": 35.99502,
    "longitude": 119.40259
  },
  {
    "city": "Zhumadian",
    "latitude": 32.97944,
    "longitude": 114.02944
  },
  {
    "city": "Zhuzhou",
    "latitude": 27.83333,
    "longitude": 113.15
  },
  {
    "city": "Zibo",
    "latitude": 36.79056,
    "longitude": 118.06333
  },
  {
    "city": "Zigong",
    "latitude": 29.34162,
    "longitude": 104.77689
  },
  {
    "city": "Zilina",
    "latitude": 49.16667,
    "longitude": 19.16667
  },
  {
    "city": "Zonguldak",
    "latitude": 41.25,
    "longitude": 31.83333
  },
  {
    "city": "Zurich",
    "latitude": 47.3769,
    "longitude": 8.5417
  }
];
  
  module.exports = {
    CITIES,
  };
  