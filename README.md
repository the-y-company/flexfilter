<!-- badges: start -->
<!-- badges: end -->

# flexfilter

Dynamic filters for shiny.

## Installation

You can install the development version of flexfilter from [GitHub](https://github.com/) with:

``` r
# install.packages("remotes")
remotes::install_github("devOpifex/flexfilter")
```

## Example

This is a basic example which shows you how to solve a common problem:

```r
library(shiny)
library(flexfilter)

data <- data.frame(
  text = letters[1:10],
  factors = as.factor(LETTERS[1:10]),
  numeric = runif(10),
  integer = 1:10,
  date = seq.Date(Sys.Date()-9, Sys.Date(), by = "day"),
  logical = sample(c(T, F), 10, replace = TRUE)
)
attr(data$date, "label") <- "The Date label"
attr(data$date, "description") <- "This describes the date"

ui <- fluidPage(
  theme = bslib::bs_theme(5L),
  flexfilterUI("filter"),
  DT::DTOutput("table")
)

server <- function(input, output, session) {
  values <- flexfilter_server("filter", data)

  observe({
    print(values())
  })

  output$table <- DT::renderDT({
    if(!length(values()$exprs))
      return(data)

    data |>
      dplyr::filter(!!!values()$exprs) |>
      DT::datatable()
  })
}

shinyApp(ui, server)
```

### Variables only

Set `variables_only` to `TRUE` and only variables are displayed (no filter inputs).

```r
library(shiny)
library(flexfilter)

data <- data.frame(
  text = letters[1:10],
  factors = as.factor(LETTERS[1:10]),
  numeric = runif(10),
  integer = 1:10,
  date = seq.Date(Sys.Date()-9, Sys.Date(), by = "day"),
  logical = sample(c(T, F), 10, replace = TRUE)
)
attr(data$date, "label") <- "The Date label"
attr(data$date, "description") <- "This describes the date"

ui <- fluidPage(
  theme = bslib::bs_theme(5L),
  flexfilterUI("filter"),
  DT::DTOutput("table")
)

server <- function(input, output, session) {
  # only return variable names
  values <- flexfilter_server("filter", data, variables_only = TRUE)

  observe({
    print(values())
  })

  output$table <- DT::renderDT({
    if(!length(values()))
      return(data)

    data |>
      dplyr::select(values()) |>
      DT::datatable()
  })
}

shinyApp(ui, server)
```

