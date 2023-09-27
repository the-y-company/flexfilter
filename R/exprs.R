make_exprs <- function(data, values) {
  lapply(seq_along(values), \(i) {
    get_expression(data[[names(values)[i]]], names(values)[i], unlist(values[i])) |>
      rlang::parse_expr()
  })
}

get_expression <- function(x, col, value){
  UseMethod("get_expression")
}

#' @method get_expression default
#' @export
get_expression.default <- function(x, col, value){
  sprintf("%s == '%s'", col, value)
}

#' @method get_expression factor
#' @export
get_expression.factor <- function(x, col, value){
  values <- paste0("'", value, "'", collapse = ",")
  sprintf("%s %%in%% c(%s)", col, values)
}

#' @method get_expression logical
#' @export
get_expression.logical <- function(x, col, value){
  values <- paste0("'", value, "'", collapse = ",")
  sprintf("%s %%in%% c(%s)", col, values)
}

#' @method get_expression numeric
#' @export
get_expression.numeric <- function(x, col, value){
  sprintf(
    "%s >= %s & %s <= %s",
    col,
    value[1],
    col,
    value[2]
  )
}

#' @method get_expression Date
#' @export
get_expression.Date <- function(x, col, value){
  sprintf(
    "%s >= as.Date('%s') & %s <= as.Date('%s')",
    col,
    value[1],
    col,
    value[2]
  )
}
