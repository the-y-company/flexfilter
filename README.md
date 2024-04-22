<!-- badges: start -->
<!-- badges: end -->

# flexfilter

Flexible filters for shiny.

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

ui <- fluidPage(
  theme = bslib::bs_theme(5L),
  flexfilterUI("filter"),
  DT::DTOutput("table")
)

server <- function(input, output, session) {
  values <- flexfilter_server("filter", data)

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

Funded by [The Association of State and Territorial Health Officials](https://www.astho.org).
