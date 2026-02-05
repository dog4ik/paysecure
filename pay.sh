#!/usr/bin/env bash

# mid 5279 (f07d242abdba30eee902) http://localhost:6001/settings/admin/user/5180/edit?return_to=

curl 'http://localhost:4000/api/v1/payments' \
-X POST \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer f07d242abdba30eee902' \
-d '{
  "amount": 123456,
  "currency": "EUR",
  "customer": {
    "email": "rahultest@gmail.com",
    "country": "GB",
    "address": "10 New Burlington StreetApt. 214",
    "postcode": "W1S 3BE",
    "first_name": "Rahul",
    "last_name": "Agarwal",
    "city": "London"
  },
  "product": "tesg ceoduct",
  "callbackUrl": "http://host.docker.internal:6767/4680"
}'

# curl 'http://localhost:4000/api/v1/payments' \
# -X POST \
# -H 'Content-Type: application/json' \
# -H 'Authorization: Bearer f07d242abdba30eee902' \
# -d '{
#   "amount": 123456,
#   "currency": "EUR",
#   "customer": {
#     "email": "rahultest@gmail.com",
#     "country": "GB",
#     "phone": "+91 9634088561",
#     "birthday": "1994-31-04",
#     "address": "10 New Burlington StreetApt. 214",
#     "state": "RJ",
#     "postcode": "W1S 3BE",
#     "first_name": "Rahul",
#     "last_name": "Agarwal",
#     "city": "London"
#   },
#   "extra_return_param": "APPLEPAY-REDIRECT",
#   "product": "tesg ceoduct",
#   "callbackUrl": "http://host.docker.internal:6767/4680"
# }'
