def fetch_data(grid_data):
    """
    Process data received from the React DataGrid.

    Expected input:

    {
        "columns": ["Product", "Rating", "Review"],
        "rows": [
            {
                "Product": "iPhone",
                "Rating": "5",
                "Review": "Excellent product"
            }
        ]
    }

    Returns:

    [
        {
            "Product": "iPhone",
            "Rating": "5",
            "Review": "Excellent product"
        }
    ]
    """

    if not isinstance(grid_data, dict):
        raise ValueError("Grid data must be an object.")

    columns = grid_data.get("columns", [])
    rows = grid_data.get("rows", [])

    if not isinstance(columns, list):
        raise ValueError("Columns must be a list.")

    if not isinstance(rows, list):
        raise ValueError("Rows must be a list.")

    if not columns:
        raise ValueError("No columns provided.")

    if not rows:
        raise ValueError("No rows provided.")

    processed_data = []

    for row in rows:

        if not isinstance(row, dict):
            continue

        processed_row = {}

        for column in columns:
            processed_row[column] = row.get(column, "")

        processed_data.append(processed_row)

    return processed_data