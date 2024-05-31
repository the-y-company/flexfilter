install: check
	R -s -e "devtools::install()"

check: document
	R -s -e "devtools::check()"

bundle:
	R -s -e "packer::bundle_prod()"

bundle_dev:
	R -s -e "packer::bundle_dev()"

document: mkdoc
	R -s -e "devtools::document()"

mkdoc:
	mkdocs build
	
mkdoc_dev:
	mkdocs serve

dev: document bundle_dev
	Rscript test.R

