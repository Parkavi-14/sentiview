from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from ml.inference import predict_sentiment
from fetch_data import fetch_data


@api_view(["POST"])
def analyze_sentiment(request):

    text = request.data.get("text", "").strip()

    if not text:
        return Response(
            {"error": "Text is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    result = predict_sentiment(text)

    response_data = {
        "text": text,
        "sentiment": result["label"],
        "confidence": result["confidence"],
        "scores": result["scores"]
    }

    # Include reason when present
    if "reason" in result:
        response_data["reason"] = result["reason"]

    return Response(response_data)


@api_view(["POST"])
def fetch_grid_data(request):

    try:

        # Get grid data from React
        grid_data = request.data

        # Process grid data
        data = fetch_data(grid_data)

        return Response(
            {
                "success": True,
                "data": data,
                "count": len(data)
            },
            status=status.HTTP_200_OK
        )

    except ValueError as error:

        return Response(
            {
                "success": False,
                "error": str(error)
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    except Exception as error:

        return Response(
            {
                "success": False,
                "error": "Failed to process grid data.",
                "details": str(error)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )