from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet,CampViewSet
from .views import ServiceSelectionViewSet,TestCaseDataViewSet,ServicePriceView,CostDetailsViewSet,ServiceCostViewSet
from .views import validate_coupon
from .views import PDFUploadView
from .views import generate_pdf_view
from .views import CostSummaryViewSet
from .views import CopyPriceViewSet,CompanyDetailsViewSet,UserViewSet
from .views import ServiceSelectionView


router = DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'camps', CampViewSet)

router.register(r'service-selection', ServiceSelectionViewSet)

router.register(r'test-case-data', TestCaseDataViewSet, basename='test-case-data')

router.register(r'cost_details', CostDetailsViewSet, basename='cost_details')

router.register(r'service_costs', ServiceCostViewSet)
router.register(r'costsummaries', CostSummaryViewSet)
router.register(r'copyprice',CopyPriceViewSet)
router.register(r'company-details', CompanyDetailsViewSet)
router.register(r'users', UserViewSet)


urlpatterns = [
    path('', include(router.urls)),
    path('prices/', ServicePriceView.as_view(), name='service-prices'),
    path('api/validate-coupon/<str:code>/', validate_coupon, name='validate_coupon'),
    path('upload-pdf/', PDFUploadView.as_view(), name='upload_pdf'),
    path('view-pdf/<int:pk>/', generate_pdf_view, name='view_pdf'),
    path('api/service-selection/', ServiceSelectionView.as_view(), name='service-selection'),

]
