#' Flex filter
#' 
#' Flex filter component.
#' 
#' @param id Module id.
#' @param data Dataset.
#' @param variables_only Set to `TRUE` to not display filters and only display
#' variable names.
#' @param btn_class Additional classes to pass to the button
#' 
#' @importFrom shiny tagList div NS tags
#' 
#' @name flexfilter
#' 
#' @export
flexfilterUI <- function(id, btn_class = ""){
  ns <- NS(id)

	tagList(
    div(
      id = ns("filter"),
      div(
        id = ns("filters")
      ),
      div(
        id = ns("add"),
        class = "input-group",
        tags$button(
          class = sprintf("btn btn-outline-secondary dropdown-toggle w-100 %s", btn_class),
          type = "button",
          `data-bs-toggle` = "dropdown",
          `aria-expanded` = "false",
          "Add variable"
        ),
        tags$ul(
          id = ns("variables"),
          class = "dropdown-menu w-100"
        )
      )
    ),
    selectizeDependency(),
    ionRangeSliderDependency(),
    fontawesomeDependency(),
    datePickerDependency(),
    flexFilterDependency()
	)
}

#' @importFrom shiny moduleServer observe reactive
#' @rdname flexfilter
#' @export
flexfilter_server <- function(id, data, variables_only = FALSE){
  if(missing(id))
    stop("Missing `id`")

  if(missing(data))
    stop("Missing `data`")

	moduleServer(
		id,
		function(
			input, 
			output, 
			session
    ){
      ns <- session$ns

      observe({
        path_variables <- session$registerDataObj(
          "get-variables",
          data = data,
          filterFunc = endpoint_variables
        )

        path_variable <- session$registerDataObj(
          "get-variable",
          data = data,
          filterFunc = endpoint_variable
        )

        session$sendCustomMessage(
          "flexfilter-endpoints",
          list(
            pathVariables = path_variables,
            pathVariable = path_variable,
            variablesOnly = variables_only,
            ns = ns(NULL)
          )
        )
      })

      reactive({
        if(variables_only){
          return(names(input$values))
        }

        list(
          values = input$values,
          exprs = make_exprs(data, input$values)
        )
      })
		}
	)
}

