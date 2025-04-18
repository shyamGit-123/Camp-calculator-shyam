from django.shortcuts import render
from django.contrib.auth import authenticate
# Create your views here.
from rest_framework import viewsets
from .models import Company,Camp,ServiceSelection,TestData,Service,CostDetails,TestType,ServiceCost,CostSummary,CopyPrice,CompanyDetails,User
from .serializers import CampSerializer,CompanySerializer,ServiceSelectionSerializer,TestCaseDataSerializer,ServiceSerializer,CostDetailsSerializer,ServiceCostSerializer,CostSummarySerializer,CopyPriceSerializer,CompanyDetailsSerializer,UserSerializer

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status
from rest_framework.views import APIView
from rest_framework import generics
from django.contrib.auth import authenticate,login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from django.shortcuts import get_object_or_404
from .models import DiscountCoupon
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Estimation
from django.http import HttpResponse, FileResponse
from django.conf import settings
import os
from reportlab.pdfgen import canvas
from django.core.files import File
from django.core.mail import send_mail
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer

class CampViewSet(viewsets.ModelViewSet):
    queryset = Camp.objects.all()
    serializer_class = CampSerializer


# class ServiceSelectionViewSet(viewsets.ModelViewSet):
#     queryset = ServiceSelection.objects.all()
#     serializer_class = ServiceSelectionSerializer
    
#     @action(detail=False, methods=['post'])
#     def create_services(self, request):
#         """
#         Create or update service packages for a company
#         """
#         try:
#             data = request.data
#             company_id = data.get('company_id')
#             packages = data.get('packages', [])
            
#             if not company_id:
#                 return Response(
#                     {'success': False, 'error': 'Company ID is required'}, 
#                     status=status.HTTP_400_BAD_REQUEST
#                 )
                
#             if not packages:
#                 return Response(
#                     {'success': False, 'error': 'At least one package is required'}, 
#                     status=status.HTTP_400_BAD_REQUEST
#                 )
            
#             # Delete existing service selections for this company
#             ServiceSelection.objects.filter(company_id=company_id).delete()
            
#             # Create new service selection
#             service_selection = ServiceSelection.objects.create(
#                 company_id=company_id,
#                 selected_services=packages
#             )
            
#             serializer = ServiceSelectionSerializer(service_selection)
#             return Response({
#                 'success': True,
#                 'data': serializer.data
#             }, status=status.HTTP_201_CREATED)
            
#         except Exception as e:
#             return Response({
#                 'success': False,
#                 'error': str(e)
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ServiceSelectionViewSet(viewsets.ModelViewSet):
    queryset = ServiceSelection.objects.all()
    serializer_class = ServiceSelectionSerializer
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def create_services(self, request):
        """
        Create or update service packages for a company
        """
        try:
            data = request.data
            company_id = data.get('company_id')
            packages = data.get('packages', [])
            
            if not company_id:
                return Response(
                    {'success': False, 'error': 'Company ID is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if not packages:
                return Response(
                    {'success': False, 'error': 'At least one package is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Delete existing service selections for this company
            ServiceSelection.objects.filter(company_id=company_id).delete()
            
            # Create new service selection
            service_selection = ServiceSelection.objects.create(
                company_id=company_id,
                packages=packages
            )
            
            serializer = ServiceSelectionSerializer(service_selection)
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

class TestCaseDataViewSet(viewsets.ModelViewSet):
    queryset = TestData.objects.all()
    serializer_class = TestCaseDataSerializer

    def create(self, request, *args, **kwargs):
        try:
            data = request.data
            if not isinstance(data, list):
                data = [data]

            serializer = self.get_serializer(data=data, many=True)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)

            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, *args, **kwargs):
        company_id = request.query_params.get('company_id')
        if company_id:
            queryset = self.queryset.filter(company_id=company_id)
        else:
            queryset = self.queryset.all()

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'data': serializer.data
        })

    @action(detail=False, methods=['get'])
    def by_package(self, request):
        package_name = request.query_params.get('package_name')
        company_id = request.query_params.get('company_id')

        if not package_name or not company_id:
            return Response({
                'success': False,
                'error': 'Both package_name and company_id are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        queryset = self.queryset.filter(
            package_name=package_name,
            company_id=company_id
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })


class ServicePriceView(APIView):
    def get(self, request):
        services = Service.objects.all()
        serializer = ServiceSerializer(services, many=True)
        return Response(serializer.data)


class CostDetailsViewSet(viewsets.ViewSet):
    def create(self, request):
        data = request.data
        company_id = data.get('company_id')
        packages = data.get('packages', [])
        
        if not company_id:
            return Response({'error': 'Company ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Process package data
        for package in packages:
            package_name = package.get('package_name')
            services = package.get('services', [])
            travel = package.get('travel', 0)
            stay = package.get('stay', 0)
            food = package.get('food', 0)
            total_cost = package.get('total_cost', 0)
            
            # For each service in the package, update or create cost details
            for service in services:
                CostDetails.objects.update_or_create(
                    company_id=company_id,
                    service_name=service,
                    defaults={
                        'food': food,
                        'stay': stay,
                        'travel': travel,
                        # We're not getting individual service costs in this API,
                        # but we could calculate or distribute them if needed
                        'salary': 0,
                        'misc': 0,
                        'equipment': 0,
                        'consumables': 0,
                        'reporting': 0,
                    }
                )
        
        return Response({'message': 'Package costs saved successfully'}, status=status.HTTP_201_CREATED)
    
    def list(self, request):
        company_id = request.query_params.get('company_id')
        
        if company_id:
            queryset = CostDetails.objects.filter(company_id=company_id)
        else:
            queryset = CostDetails.objects.all()
            
        serializer = CostDetailsSerializer(queryset, many=True)
        return Response(serializer.data)
    



class ServiceCostViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ServiceCost.objects.all()
    serializer_class = ServiceCostSerializer


 

def validate_coupon(request, code):
    coupon = get_object_or_404(DiscountCoupon, code=code)
    return JsonResponse({
        'code': coupon.code,
        'discount_percentage': coupon.discount_percentage,
    })


class PDFUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, *args, **kwargs):
        return Response({'message': 'Use POST to upload a PDF'}, status=405)

    def post(self, request, *args, **kwargs):
        pdf_file = request.FILES.get('pdf')
        company_name = request.data.get('company_name', 'Unknown Company')

        estimation = Estimation.objects.create(
            company_name=company_name,
            pdf_file=pdf_file
        )

        return Response({'message': 'PDF uploaded successfully!', 'pdf_id': estimation.id})


def generate_pdf_view(request):
    # Create a PDF using ReportLab
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="ESTIMATION_Q8ElAn1.pdf"'

    # Create the PDF (Example using ReportLab)
    p = canvas.Canvas(response)
    p.drawString(100, 100, "Hello, this is your PDF.")
    p.showPage()
    p.save()

    # Save the PDF to the specified path
    pdf_dir = os.path.join(settings.MEDIA_ROOT, 'estimations')
    os.makedirs(pdf_dir, exist_ok=True)  # Ensure directory exists
    pdf_path = os.path.join(pdf_dir, 'ESTIMATION_Q8ElAn1.pdf')
    
    with open(pdf_path, 'wb') as f:
        f.write(response.getvalue())

    return response



class CostSummaryViewSet(viewsets.ModelViewSet):
    queryset = CostSummary.objects.all()
    serializer_class = CostSummarySerializer




class CopyPriceViewSet(viewsets.ModelViewSet):
      queryset = CopyPrice.objects.all()
      serializer_class = CopyPriceSerializer




class CompanyDetailsViewSet(viewsets.ModelViewSet):
    queryset = CompanyDetails.objects.all()
    serializer_class = CompanyDetailsSerializer




class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class ServiceSelectionView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            # Log incoming data for debugging
            logger.info(f"Received data: {request.data}")
            
            company_id = request.data.get('company_id')
            packages = request.data.get('packages', [])
            
            if not company_id:
                return Response({
                    'success': False,
                    'error': 'Company ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not packages:
                print("No packages provided")
                return Response({
                    'success': False,
                    'error': 'At least one package is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Prepare data for serializer
            serializer_data = {
                'company_id': company_id,
                'packages': packages  # Changed from selected_services to packages
            }
            print(serializer_data)
            
            serializer = ServiceSelectionSerializer(data=serializer_data)
            if serializer.is_valid():
                # Delete existing selections for this company
                ServiceSelection.objects.filter(company_id=company_id).delete()
                
                # Save new selection
                instance = serializer.save()
                print("Service selection saved successfully")
                return Response({
                    'success': True,
                    'data': ServiceSelectionSerializer(instance).data
                }, status=status.HTTP_201_CREATED)
            
            logger.error(f"Validation errors: {serializer.errors}")
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Error processing service selection: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)