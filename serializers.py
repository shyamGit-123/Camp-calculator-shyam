import json
from rest_framework import serializers
from .models import Company,Camp,ServiceSelection,TestData,PriceRange,Service,CostDetails,ServiceCost,CostSummary,CopyPrice,CompanyDetails,ServiceDetails,User

class CampSerializer(serializers.ModelSerializer):
    class Meta:
        model = Camp
        fields = '__all__'


class CompanySerializer(serializers.ModelSerializer):
    camps = CampSerializer(many=True, read_only=True)
    
    class Meta:
        model = Company
        fields = '__all__'

# class PackageSerializer(serializers.Serializer):
#     package_name = serializers.CharField()
#     services = serializers.ListField(child=serializers.CharField())

# class ServiceSelectionSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = ServiceSelection
#         fields = ['id', 'company_id', 'selected_services']

#     def validate(self, data):
#         if not data.get('company_id'):
#             raise serializers.ValidationError({'company_id': 'This field is required'})
        
#         if not data.get('selected_services'):
#             raise serializers.ValidationError({'selected_services': 'This field is required'})
        
#         return data

#     def create(self, validated_data):
#         packages = self.initial_data.get('packages', [])
#         instance = ServiceSelection.objects.create(
#             company_id=validated_data['company_id'],
#             selected_services=packages
#         )
        
#         return instance
#  Sunday code


# class PackageSerializer(serializers.Serializer):
#     package_name = serializers.CharField()
#     services = serializers.ListField(child=serializers.CharField())

# class ServiceSelectionSerializer(serializers.ModelSerializer):
#     packages = PackageSerializer(many=True)

#     class Meta:
#         model = ServiceSelection
#         fields = ['id', 'company_id', 'packages']

#     def validate(self, data):
#         if not data.get('company_id'):
#             raise serializers.ValidationError({'company_id': 'This field is required'})
#         if not data.get('packages'):
#             raise serializers.ValidationError({'packages': 'At least one package is required'})
#         return data

#     def create(self, validated_data):
#         instance = ServiceSelection.objects.create(
#             company_id=validated_data['company_id'],
#             packages=validated_data['packages']
#         )
#         return instance
class PackageSerializer(serializers.Serializer):
    package_name = serializers.CharField()
    services = serializers.ListField(child=serializers.CharField())

class ServiceSelectionSerializer(serializers.ModelSerializer):
    packages = serializers.JSONField()  # Use JSONField for storage
    
    class Meta:
        model = ServiceSelection
        fields = ['id', 'company_id', 'packages']
    
    def to_representation(self, instance):
        """Custom representation to handle JSON data properly"""
        data = super().to_representation(instance)
        # If packages is already a list of dictionaries, return as is
        # Otherwise, parse the JSON if it's a string
        if isinstance(data['packages'], str):
            try:
                data['packages'] = json.loads(data['packages'])
            except json.JSONDecodeError:
                data['packages'] = []  # Return empty list if invalid JSON
        return data


class PriceRangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceRange
        fields = ['max_cases', 'price']

class ServiceSerializer(serializers.ModelSerializer):
    price_ranges = PriceRangeSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        fields = ['name', 'price_ranges']



class CostDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostDetails
        fields = ['company_id', 'service_name', 'travel', 'stay', 'food', 'salary', 'misc', 'equipment', 'consumables', 'reporting']


class ServiceCostSerializer(serializers.ModelSerializer):
    test_type_name = serializers.CharField(source='test_type.name', read_only=True)

    class Meta:
        model = ServiceCost
        fields = ['test_type_name', 'salary', 'incentive', 'misc', 'equipment','consumables','reporting']



    
class CostSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = CostSummary
        fields = '__all__'

class CopyPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model=CopyPrice
        fields = '__all__'


class ServiceDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceDetails
        fields = ['service_name', 'total_cases']

class CompanyDetailsSerializer(serializers.ModelSerializer):
    services = ServiceDetailsSerializer(many=True)

    class Meta:
        model = CompanyDetails
        fields = ['company_name', 'grand_total', 'services','super_company']

    def create(self, validated_data):
        services_data = validated_data.pop('services')
        company = CompanyDetails.objects.create(**validated_data)
        for service_data in services_data:
            ServiceDetails.objects.create(company=company, **service_data)
        return company
    


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

# class TestDataSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = TestData
#         fields = [
#             'id',
#             'company_id',
#             'package_name',
#             'service_name',
#             'case_per_day',
#             'number_of_days',
#             'total_case',
#             'report_type',
#             'report_type_cost',
#             'created_at'
#         ]
#         read_only_fields = ['total_case', 'report_type_cost', 'created_at']

#     def validate(self, data):
#         """
#         Custom validation for the test data
#         """
#         if data['case_per_day'] <= 0:
#             raise serializers.ValidationError({
#                 "case_per_day": "Cases per day must be greater than 0"
#             })
        
#         if data['number_of_days'] <= 0:
#             raise serializers.ValidationError({
#                 "number_of_days": "Number of days must be greater than 0"
#             })

#         return data

class TestCaseDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestData
        fields = [
            'id',
            'company_id',
            'package_name',
            'service_name',
            'case_per_day',
            'number_of_days',
            'total_case',
            'report_type',
            'report_type_cost'
        ]
        read_only_fields = ['total_case', 'report_type_cost']

    def validate(self, data):
        """
        Validate the test case data
        """
        if data.get('case_per_day', 0) <= 0:
            raise serializers.ValidationError({
                "case_per_day": "Cases per day must be greater than 0"
            })
        
        if data.get('number_of_days', 0) <= 0:
            raise serializers.ValidationError({
                "number_of_days": "Number of days must be greater than 0"
            })

        if data.get('report_type') not in ['digital', 'hard copy']:
            raise serializers.ValidationError({
                "report_type": "Report type must be either 'digital' or 'hard copy'"
            })

        return data

    def create(self, validated_data):
        # Calculate total_case and report_type_cost
        validated_data['total_case'] = (
            validated_data['case_per_day'] * validated_data['number_of_days']
        )
        
        # Calculate report_type_cost if hard copy
        if validated_data['report_type'] == 'hard copy':
            validated_data['report_type_cost'] = validated_data['total_case'] * 25
        else:
            validated_data['report_type_cost'] = 0

        return super().create(validated_data)


