from rest_framework import serializers
from dj_rest_auth.serializers import UserDetailsSerializer


class MongoUserDetailsSerializer(UserDetailsSerializer):
    pk = serializers.CharField(read_only=True)
