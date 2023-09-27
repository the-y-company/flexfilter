get_variables <- function(data){
  lapply(seq_along(data), \(i){
    list(
      class = class(data[[i]]),
      label = attr(data[[i]], "label"),
      description = attr(data[[i]], "description"),
      name = names(data)[i]
    )
  }) |> 
    unname()
}

get_data <- function(x){
  UseMethod("get_data")
}

#' @method get_data default
#' @export
get_data.default <- function(x){
  list(
    type = "character",
    label = attr(x, "label"),
    description = attr(x, "description")
  )
}

#' @method get_data numeric
#' @export
get_data.numeric <- function(x){
  list(
    min = min(x),
    max = max(x),
    step = get_step(x),
    type = "numeric",
    label = attr(x, "label"),
    description = attr(x, "description")
  )
}

#' @method get_data Date
#' @export
get_data.Date <- function(x){
  list(
    min = min(x),
    max = max(x),
    type = "date",
    label = attr(x, "label"),
    description = attr(x, "description")
  )
}

#' @method get_data POSIXct
#' @export
get_data.POSIXct <- function(x){
  list(
    min = min(x),
    max = max(x),
    type = "datetime",
    label = attr(x, "label"),
    description = attr(x, "description")
  )
}

#' @method get_data factor
#' @export
get_data.factor <- function(x){
  list(
    values = x |> unique() |> unname(),
    type = "factor",
    label = attr(x, "label"),
    description = attr(x, "description")
  )
}

#' @method get_data character
#' @export
get_data.character <- function(x){
  list(
    values = x |> unique() |> unname(),
    type = "factor",
    label = attr(x, "label"),
    description = attr(x, "description")
  )
}

#' @method get_data logical
#' @export
get_data.logical <- function(x){
  list(
    values = c(TRUE, FALSE),
    type = "logical",
    label = attr(x, "label"),
    description = attr(x, "description")
  )
}

get_step <- function(x){
  diff <- max(x) - min(x)

  if(diff < 1)
    return(.1)

  if(diff > 1000)
    return(5L)

  return(1L)
}
