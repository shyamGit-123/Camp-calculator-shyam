from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from rest_framework import serializers
from django.contrib.auth.hashers import make_password, check_password
# Create your models here.
class Company(models.Model):
    name = models.CharField(max_length=255)
    district = models.CharField(max_length=255)
    state = models.CharField(max_length=255)
    pin_code = models.CharField(max_length=10)
    landmark = models.CharField(max_length=255)

class Camp(models.Model):
    company = models.ForeignKey(Company, related_name='camps', on_delete=models.CASCADE)
    location = models.CharField(max_length=255)
    district = models.CharField(max_length=255)
    state = models.CharField(max_length=255)
    pin_code = models.CharField(max_length=10)
    landmark = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()


# class ServiceSelection(models.Model):
#     company_id = models.CharField(max_length=255)
#     selected_services = models.JSONField()  # Store selected services as a JSON array
#     created_at = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         ordering = ['-created_at']

#     def __str__(self):
#         return f"Company ID: {self.company_id}, Services: {self.selected_services}"

class ServiceSelection(models.Model):
    company_id = models.CharField(max_length=255)
    packages = models.JSONField()  # changed from selected_services to packages
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Service Selection for Company {self.company_id}"


    
   
# class ServiceSelectionSerializer(serializers.ModelSerializer):
#     packages = serializers.ListField(write_only=True, required=False)

#     class Meta:
#         model = ServiceSelection
#         fields = ['id', 'company_id', 'selected_services', 'packages']

#     def validate(self, data):
#         """
#         Check that either selected_services or packages is provided
#         """
#         if not data.get('company_id'):
#             raise serializers.ValidationError({"company_id": "This field is required"})
        
#         packages = self.context['request'].data.get('packages', [])
#         if not packages:
#             raise serializers.ValidationError({"packages": "At least one package is required"})
        
#         return data

#     def create(self, validated_data):
#         packages = self.context['request'].data.get('packages', [])
#         validated_data['selected_services'] = packages
#         if 'packages' in validated_data:
#             validated_data.pop('packages')
#         return super().create(validated_data)
    
    
    
class TestData(models.Model):
    company_id = models.IntegerField()
    package_name = models.CharField(max_length=255)
    service_name = models.CharField(max_length=100)
    case_per_day = models.IntegerField()
    number_of_days = models.IntegerField()
    total_case = models.IntegerField()
    report_type = models.CharField(
        max_length=20,
        choices=[('digital', 'Digital'), ('hard copy', 'Hard Copy')],
        default='digital'
    )
    report_type_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'test_data'

    def save(self, *args, **kwargs):
        # Calculate total cases
        self.total_case = self.case_per_day * self.number_of_days
        
        # Calculate report cost if hard copy
        if self.report_type == 'hard copy':
            self.report_type_cost = self.total_case * 25  # 25 rupees per case
        else:
            self.report_type_cost = 0
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.package_name} - {self.service_name} - {self.total_case} cases"
    



class Service(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class PriceRange(models.Model):
    service = models.ForeignKey(Service, related_name='price_ranges', on_delete=models.CASCADE)
    max_cases = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f'{self.service.name}: Up to {self.max_cases} cases - ₹{self.price}'
    


class CostDetails(models.Model):
    company_id = models.IntegerField()
    service_name = models.CharField(max_length=255)
    travel = models.IntegerField(default=0)
    stay = models.IntegerField(default=0)
    food = models.IntegerField(default=0)
    salary = models.IntegerField(default=0)
    misc = models.IntegerField(default=0)
    equipment = models.IntegerField(default=0)
    consumables = models.IntegerField(default=0)
    reporting = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ['company_id', 'service_name']
        
    def __str__(self):
        return f"{self.service_name} for Company {self.company_id}"
    

class TestType(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class ServiceCost(models.Model):
    test_type = models.OneToOneField(TestType, on_delete=models.CASCADE)
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    incentive = models.DecimalField(max_digits=10, decimal_places=2)
    misc = models.DecimalField(max_digits=10, decimal_places=2)
    equipment = models.DecimalField(max_digits=10, decimal_places=2)
    consumables= models.DecimalField(max_digits=10, decimal_places=2)
    reporting= models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.test_type.name} Costs"
    



class DiscountCoupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2)

    def __str__(self):
        return f"{self.code} - {self.discount_percentage}%"
    


class Estimation(models.Model):
    company_name = models.CharField(max_length=255)
    pdf_file = models.FileField(upload_to='estimations/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.company_name} - {self.created_at}"
    


class CostSummary(models.Model):
    company_id = models.CharField(max_length=255)
    billing_number = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    company_state = models.CharField(max_length=255, blank=True, null=True)
    company_district = models.CharField(max_length=255, blank=True, null=True)
    company_pincode = models.CharField(max_length=10, blank=True, null=True)
    company_landmark = models.CharField(max_length=255, blank=True, null=True)
    company_address = models.TextField(blank=True, null=True)
    camp_details = models.JSONField()  # Store camp locations and dates as JSON
    service_details = models.JSONField()  # Store service details as JSON
    grand_total = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.company_name} - {self.billing_number}"
    

class CopyPrice(models.Model):
    name=models.CharField(max_length=100)
    hard_copy_price=models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.name
        
class CompanyDetails(models.Model):
    company_name = models.CharField(max_length=255)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2)
    super_company = models.CharField(max_length=255)

    def __str__(self):
        return self.company_name

class ServiceDetails(models.Model):
    company = models.ForeignKey(CompanyDetails, related_name='services', on_delete=models.CASCADE)
    service_name = models.CharField(max_length=255)
    total_cases = models.IntegerField()

    def __str__(self):
        return f"{self.service_name} for {self.company.company_name}"
    

class User(models.Model):
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)  # Make sure to hash passwords in production
    company_name = models.CharField(max_length=255)

    def __str__(self):
        return self.username