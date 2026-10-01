from django.urls import path

from .views import (
    analyze_sentiment,
    fetch_grid_data
)


urlpatterns = [

    # Existing sentiment API
    path(
        "analyze/",
        analyze_sentiment
    ),

    # New DataGrid API
    path(
        "fetch-data/",
        fetch_grid_data
    ),

]