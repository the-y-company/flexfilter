#' @importFrom shiny parseQueryString
endpoint_variable <- function(data, req) {
  query <- parseQueryString(req$QUERY_STRING)

  if(!length(query$variable))
    return(http_response_json(data))

  var <- get_data(data[[query$variable]])
  var$name <- query$variable

  return(http_response_json(var))
}

#' @importFrom shiny parseQueryString
endpoint_variables <- function(data, req) {
  data |>
    get_variables() |>
    http_response_json()
}

#' @importFrom jsonlite toJSON
http_response_json <- function(content) {
  content |>
    toJSON(dataframe = "rows", auto_unbox = TRUE, null = "null") |>
    http_response()
}

#' @importFrom shiny httpResponse
http_response <- function(data, content_type = "application/json") {
  httpResponse(content = data, content_type = content_type)
}

