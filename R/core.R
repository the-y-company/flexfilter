#' Flex filter
#' 
#' Flex filter component.
#' 
#' @param id Module id.
#' @param data Dataset.
#' 
#' @importFrom shiny tagList div NS tags
#' 
#' @name flexfilter
#' 
#' @export
flexfilterUI <- function(id){
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
          class = "btn btn-outline-secondary dropdown-toggle w-100",
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
flexfilter_server <- function(id, data){
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
            ns = ns(NULL)
          )
        )
      })

      reactive({
        list(
          values = input$values,
          exprs = make_exprs(data, input$values)
        )
      })
		}
	)
}

