// Hooks
import React, { useEffect, useState, useContext } from 'react'
import { Table, Spinner, ToastContext } from 'vtex.styleguide'
import { useRuntime } from 'vtex.render-runtime'

// Components
import AutocompleteBlock from '../components/SearchSKU/AutocompleteBlock'
import EditableWishlistTitle from './WishlistName/WishlistName'
import WishlistPrivacyOptions from './WishlistPrivacyOptions'
import ModalCreateList from './ModalCreateList'
import useCreateListAccount from '../hooks/useCreateListAccount'

// Helpers & Utils
import { extractProductData, deleteItemsWishlist, getEmailID } from './helpers'
import useQueryWishlistById from '../hooks/actions/useQueryWishlistById'
import useCreateWishlist from '../hooks/actions/useMutationCreateWishlist'
import useUpdateWishlist from '../hooks/actions/useMutationUpdateWishlist'
import useDeleteWishlist from '../hooks/actions/useMutationDeleteWishlist'
import useAddToCart from '../hooks/useAddToCart'
import useBulkAction from '../hooks/useBulkAction'
import { useUserEmail } from '../hooks/useUserEmail'
import { jsonSchema } from '../utils/jsonSchema'
import useStoreGlobal from '../globalStore/globalStore'
// Table config
import {
  handleNextClick,
  handlePrevClick,
  handleSubmitDataTable,
  selectorObject,
  handleFiltersChange,
} from './helpers/tableConfig'
import {
  handleInputSearchChange,
  handleInputSearchClear,
  handleInputSearchSubmit,
} from './helpers/tableSearch'
import { initialJsonState } from '../utils/tableRowsSchema'


// Styles
import styles from '../styles.css'

function Wishlist({ wishlists, fetchData }) {
  const { deviceInfo } = useRuntime()
  const emailIDInfo = getEmailID(wishlists)
  const { selectedWishlist, setSelectedWishlist } = useStoreGlobal()
  const { showToast } = useContext(ToastContext)
  const [filterState, setfilterState] = useState({})

  const handleSelectWishlist = (id) => {
    setSelectedWishlist(id)
  }
  const [allProducts, setAllProducts] = useState(
    wishlists.length > 0 ? extractProductData(wishlists[0]) : []
  )
  const [displayedProducts, setDisplayedProducts] = useState(
    wishlists.length > 0 ? extractProductData(wishlists[0]) : []
  )

  const [isLoadingSKU, setIsLoadingSKU] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [isUpdatingQty, setIsUpdatingQty] = useState(false)
  const [updatedSelectedRows, setUpdatedSelectedRows] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [initialState, setInitialState] = useState(initialJsonState)
  const { refetch } = useQueryWishlistById(selectedWishlist, (data) => {
    if (!data || !data.getWishlist) return

    setWishlist(data.getWishlist)
    const products = extractProductData({
      products: data.getWishlist.products,
    })

    const sortedProducts = products.sort((a, b) =>
      a.department.localeCompare(b.department)
    )

    setAllProducts(sortedProducts)
    setDisplayedProducts(sortedProducts)
  })

  const { createWishlist } = useCreateWishlist(async (data) => {
    await fetchData()
    if (data && data.createWishlist) {
      setSelectedWishlist(data.createWishlist.DocumentId)
    }
  })

  const { updateWishlist } = useUpdateWishlist(() => {
    refetch().then(({ data }) => {
      if (!data || !data.getWishlist) return

      setWishlist(data.getWishlist)
      const products = extractProductData({
        products: data.getWishlist.products,
      })

      const sortedProducts = products.sort((a, b) =>
        a.department.localeCompare(b.department)
      )

      setAllProducts(sortedProducts)
      setDisplayedProducts(sortedProducts)
    })
  })

  const { deleteWishlist, loading: isDeleting } = useDeleteWishlist(
    selectedWishlist,
    async () => {
      await fetchData()
      setSelectedWishlist(wishlists[0].id)
    }
  )

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(30)
  const [totalItems, setTotalItems] = useState(0)
  const [paginatedData, setPaginatedData] = useState([])
  const addProductsToCart = useAddToCart()
  const userEmail = useUserEmail()
  const handleBulkAction = useBulkAction(
    wishlist,
    setWishlist,
    setAllProducts,
    setDisplayedProducts,
    selectedWishlist,
    setUpdatedSelectedRows,
    fetchData,
    setSelectedWishlist,
    updateWishlist
  )

  const tableSchema = jsonSchema(
    addProductsToCart,
    deleteItemsWishlist,
    selectedWishlist,
    wishlist,
    wishlists,
    updateWishlist
  )

  const {
    fieldValidationTable,
    isModalAccountTable,
    setFieldValidationTable,
    nameListAccountTable,
    setNameListAccountTable,
    setIsModalAccountTable,
    buttonCloseModalTable,
    buttonModalTable,
    handleNameListTable,
  } = useCreateListAccount()

  useEffect(() => {
    const updateStylesForMobile = () => {
      const targetElement = document.querySelector(
        'body > div.render-container.render-route-store-account > div > div.vtex-store__template.bg-base > div > div:nth-child(3) > div > div > div > div > div > div:nth-child(7) > div > div:nth-child(3) > div.whitebird-my-wishlists-0-x-componentContainer.w-two-thirds-l.w-100-ns.fr-l > div > div'
      )

      if (window.innerWidth <= 768) {
        if (targetElement) {
          targetElement.classList.remove('pa7')
          targetElement.style.setProperty('padding-left', '0rem', 'important')
        }
      } else {
        if (targetElement) {
          targetElement.classList.add('pa7')
        }
      }
    }

    updateStylesForMobile()
    window.addEventListener('resize', updateStylesForMobile)

    return () => {
      window.removeEventListener('resize', updateStylesForMobile)
    }
  }, [])

  useEffect(() => {
    const button = document.querySelector('#toggleFieldsBtn > button')
    button.style.minHeight = '28.10px'
    button.style.minWidth = 'min-content'

    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#f2f4f5'
    })

    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = ''
      button.style.color = ''
    })

    if (!button) return

    const svgContainer = button.querySelector('.vtex-button__label')
    if (svgContainer) {
      const svg = svgContainer.querySelector('svg')
      if (svg) {
        svg.style.display = 'none'
      }

      let editViewText = svgContainer.querySelector('.edit-view-text')
      if (!editViewText) {
        editViewText = document.createElement('span')
        editViewText.classList.add('edit-view-text')
        editViewText.textContent = 'Edit View'

        if (window.innerWidth <= 768) {
          button.style.minHeight = '28.09px !important'
          editViewText.textContent = 'Edit'
          editViewText.style.cssText += 'font-weight: 500; font-size: 13px'
          editViewText.style.cssText += 'top: initial'
        }

        svgContainer.appendChild(editViewText)
      }
    }
  }, [])

  useEffect(() => {
    const button = document.querySelector('#toggleFieldsBtn')

    if (window.innerWidth <= 768) {
      button.style.minHeight = '28px !important'
    }

    if (!button) return

    const handleButtonClick = () => {
      setTimeout(() => {
        const elementToStyle = document.querySelector('#toggleFieldsBtn > div')
        if (elementToStyle) {
          if (window.innerWidth <= 1046) {
            elementToStyle.style.setProperty('position', 'fixed', 'important')
            elementToStyle.style.setProperty('top', '50%', 'important')
            elementToStyle.style.setProperty('left', '50%', 'important')
            elementToStyle.style.setProperty(
              'transform',
              'translate(-50%, -50%)',
              'important'
            )
            elementToStyle.style.setProperty('z-index', '1000', 'important')
          }
        }
      }, 0)
    }

    button.addEventListener('click', handleButtonClick)

    return () => {
      button.removeEventListener('click', handleButtonClick)
    }
  }, [])

  useEffect(() => {
    setSelectedWishlist(selectedWishlist)
    handleSelectWishlist(selectedWishlist)
  }, [selectedWishlist])

  // Logic to get paginated data
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const data = displayedProducts || []
    const slicedData = data.slice(startIndex, endIndex)
    setPaginatedData(slicedData)
  }, [currentPage, itemsPerPage, displayedProducts])

  // Logic to update the total number of items
  useEffect(() => {
    const data = displayedProducts || []
    setTotalItems(data.length)
  }, [displayedProducts])

  // Handlers to change page and rows per page
  const handleRowsChange = (e, value) => {
    setItemsPerPage(parseInt(value))
    setCurrentPage(1) // Return to the first page when the number of rows per page changes
  }

  console.log('deviceInfo.type >>>> ', deviceInfo.type)

  return (
    <>
      {isDeleting ? (
        <Spinner />
      ) : (
        <>
          {deviceInfo.type === 'phone' ?
            (<div id="wish-list-mobile">
              {/* Mobile Design */}

              <div className={styles.wishlistOptionsContainer}>
                <div className={styles.wishlistSelector}>
                  <p className={styles.wishlistSelectListOneText}>
                    Favourites List
                  </p>
                  <div className={`${styles.createListandAndSelectFav}`}>
                    <select
                      className={styles.wishlistSelectListOne}
                      id="selectListTable"
                      onChange={(e) => {
                        handleSelectWishlist(e.target.value)
                      }}
                      size={1}
                      value={selectedWishlist}
                    >
                      <option value="" disabled selected>
                        Select an option
                      </option>
                      {emailIDInfo.map((newDates) => (
                        <option
                          className={styles.wishlistSelectListOneOption}
                          value={newDates.value}
                          key={newDates.value}
                          id={newDates.value}
                        >
                          {newDates.label}
                        </option>
                      ))}
                    </select>
                    <section>
                      <button
                        className={`${styles.wishlistCreateNew} ${styles.wishlistCreateNewHelper}`}
                        onClick={buttonModalTable}
                      >
                        New
                      </button>
                      {isModalAccountTable && (
                        <ModalCreateList
                          buttonCloseModal={buttonCloseModalTable}
                          handleNameList={handleNameListTable}
                          fieldValidation={fieldValidationTable}
                          handleSubmitData={(event) =>
                            handleSubmitDataTable(
                              event,
                              createWishlist,
                              userEmail,
                              setFieldValidationTable,
                              nameListAccountTable,
                              setNameListAccountTable,
                              setIsModalAccountTable,
                              fetchData
                            )
                          }
                        />
                      )}
                    </section>
                  </div>
                </div>
              </div>


              <div className={`${styles.nameAndOptionsMobile}`}>
                <EditableWishlistTitle
                  initialTitle={
                    selectedWishlist !== null ? wishlist.wishlistType : ''
                  }
                  wishlistId={
                    selectedWishlist !== null ? selectedWishlist : wishlists[0].id
                  }
                  wishlist={selectedWishlist !== null ? wishlist : wishlists[0]}
                  fetchData={fetchData}
                />
                <div className={`${styles.optionsMobile}`}>
                <WishlistPrivacyOptions
                  selectedWishlist={
                    selectedWishlist !== null ? selectedWishlist : wishlists[0].id
                  }
                  wishlists={wishlists}
                  buttonLabel="Share"
                />
                <button
                  className={styles.wishlistDeleteWishList}
                  onClick={() => deleteWishlist()}
                >
                  Delete
                </button>
                </div>
              </div>





            </div>)

            : (<div id="wish-list-desktop">
              {/* Desktop Design */}
              <EditableWishlistTitle
                initialTitle={
                  selectedWishlist !== null ? wishlist.wishlistType : ''
                }
                wishlistId={
                  selectedWishlist !== null ? selectedWishlist : wishlists[0].id
                }
                wishlist={selectedWishlist !== null ? wishlist : wishlists[0]}
                fetchData={fetchData}
              />

              <div className={styles.wishlistOptionsContainer}>
                <div className={styles.wishlistSelector}>
                  <p className={styles.wishlistSelectListOneText}>
                    Favourites List
                  </p>
                  <select
                    className={styles.wishlistSelectListOne}
                    id="selectListTable"
                    onChange={(e) => {
                      handleSelectWishlist(e.target.value)
                    }}
                    size={1}
                    value={selectedWishlist}
                  >
                    <option value="" disabled selected>
                      Select an option
                    </option>
                    {emailIDInfo.map((newDates) => (
                      <option
                        className={styles.wishlistSelectListOneOption}
                        value={newDates.value}
                        key={newDates.value}
                        id={newDates.value}
                      >
                        {newDates.label}
                      </option>
                    ))}
                  </select>
                </div>
                <section className={styles.wishlistCreationOptions}>
                  <button
                    className={`${styles.wishlistCreateNew} ${styles.wishlistCreateNewHelper}`}
                    onClick={buttonModalTable}
                  >
                    Create New List
                  </button>
                  {isModalAccountTable && (
                    <ModalCreateList
                      buttonCloseModal={buttonCloseModalTable}
                      handleNameList={handleNameListTable}
                      fieldValidation={fieldValidationTable}
                      handleSubmitData={(event) =>
                        handleSubmitDataTable(
                          event,
                          createWishlist,
                          userEmail,
                          setFieldValidationTable,
                          nameListAccountTable,
                          setNameListAccountTable,
                          setIsModalAccountTable,
                          fetchData
                        )
                      }
                    />
                  )}
                  <WishlistPrivacyOptions
                    selectedWishlist={
                      selectedWishlist !== null ? selectedWishlist : wishlists[0].id
                    }
                    wishlists={wishlists}
                    buttonLabel="Share This List"
                  />
                  <button
                    className={styles.wishlistDeleteWishList}
                    onClick={() => deleteWishlist()}
                  >
                    Delete Selected List
                  </button>
                </section>
              </div>
              
            </div>)}


{/* common */}

<AutocompleteBlock
                text="Add SKU"
                description="Search and add to your list"
                componentOnly={false}
                onAddToWishlist={async (product) => {
                  setIsLoadingSKU(true)
                  const { product: productData } = product?.data || {}
                  const item = productData?.items?.[0] || {}

                  const unitMultiplierProperty = productData?.properties?.find(
                    (prop) => prop.name === 'UnitMultiplier'
                  )
                  const unitMultiplierValue = unitMultiplierProperty
                    ? parseInt(unitMultiplierProperty.values[0], 10)
                    : 1
                  const hasBundle = unitMultiplierValue > 1

                  const newProduct = {
                    ID: Number(item?.itemId),
                    Image: item?.images?.[0]?.imageUrl,
                    unitValue: productData?.priceRange?.sellingPrice?.highPrice,
                    linkProduct: productData?.link,
                    nameProduct: productData?.productName,
                    quantityProduct: 1,
                    skuCodeReference: item?.referenceId?.[0]?.Value,
                    department: productData?.categoryTree?.[0]?.name,
                    bundle: hasBundle ? unitMultiplierValue : item?.unitMultiplier,
                  }

                  if (newProduct.bundle > 1) {
                    newProduct.quantityProduct *= newProduct.bundle
                  }

                  try {
                    if (wishlist.products.some((p) => p.ID === newProduct.ID)) {
                      showToast('You have already added this product to the list')
                      return false
                    }
                    await updateWishlist({
                      variables: {
                        wishlist: {
                          id: selectedWishlist,
                          products: [...wishlist.products, newProduct],
                        },
                      },
                    })
                    showToast('Successfully added to the Favourites List')
                    return true
                  } catch (error) {
                    console.error('Error adding to the list:', error)
                  } finally {
                    setIsLoadingSKU(false)
                  }
                }}
              />
              <section className={styles.wishlistSearchContainer}>
                <Table
                  density="medium"
                  schema={tableSchema}
                  items={paginatedData || []}
                  toolbar={{
                    inputSearch: {
                      label: 'Search This List',
                      value: searchValue,
                      onChange: (e) =>
                        handleInputSearchChange(
                          e,
                          allProducts,
                          setSearchValue,
                          setDisplayedProducts
                        ),
                      onClear: () =>
                        handleInputSearchClear(setDisplayedProducts, allProducts),
                      onSubmit: (e) =>
                        handleInputSearchSubmit(
                          e,
                          allProducts,
                          searchValue,
                          setDisplayedProducts
                        ),
                    },
                    fields: {
                      label: 'Toggle visible fields',
                      showAllLabel: 'Show All',
                      hideAllLabel: 'Hide All',
                    },
                  }}
                  bulkActions={{
                    selectedRows: updatedSelectedRows,
                    texts: {
                      secondaryActionsLabel: 'Actions',
                      rowsSelected: (qty) => (
                        <React.Fragment>Selected rows: {qty}</React.Fragment>
                      ),
                      selectAll: 'Select all',
                      allRowsSelected: (qty) => (
                        <React.Fragment>All rows selected {qty}</React.Fragment>
                      ),
                    },
                    totalItems: '',
                    onChange: (params) => {
                      setUpdatedSelectedRows(params.selectedRows)
                    },
                    others: [
                      {
                        label: 'Add to cart',
                        handleCallback: (params) =>
                          handleBulkAction(params.selectedRows, 'addToCart'),
                      },
                      {
                        label: 'Remove item(s)',
                        isDangerous: true,
                        handleCallback: (params) =>
                          handleBulkAction(
                            params.selectedRows,
                            'deleteRowsWishlist'
                          ),
                      },
                    ],
                  }}
                  pagination={{
                    onNextClick: () =>
                      handleNextClick(
                        currentPage,
                        setCurrentPage,
                        totalItems,
                        itemsPerPage
                      ),
                    onPrevClick: () => handlePrevClick(currentPage, setCurrentPage),
                    currentItemFrom: (currentPage - 1) * itemsPerPage + 1,
                    currentItemTo: Math.min(currentPage * itemsPerPage, totalItems),
                    onRowsChange: handleRowsChange,
                    textShowRows: 'Show rows',
                    textOf: 'of',
                    totalItems,
                    rowsOptions: [30, 40, 50, 60],
                  }}
                  filters={{
                    alwaysVisibleFilters: ['department', 'name'],
                    statements: initialState.filterStatements,
                    onChangeStatements: (e) => {

                      handleFiltersChange(
                        initialState.filterStatements,
                        initialState,
                        setInitialState,
                        paginatedData,
                        setPaginatedData,
                        setDisplayedProducts,
                        e[2],
                        setfilterState,
                        filterState
                      )
                    },
                    clearAllFiltersButtonLabel: 'Clear Filters',
                    collapseLeft: true,
                    options: {
                      department: {
                        label: 'Department',
                        renderFilterLabel: (st) => {
                          if (!filterState.department || !filterState.department.object) {
                            return 'All'
                          }
                          const keys = filterState.department.object ? Object.keys(filterState.department.object) : {}
                          const isAllTrue = !keys.some((key) => !filterState.department.object[key])
                          const isAllFalse = !keys.some((key) => filterState.department.object[key])
                          const trueKeys = keys.filter((key) => filterState.department.object[key])
                          let trueKeysLabel = ''
                          trueKeys.forEach((key, index) => {
                            trueKeysLabel += `${key}${index === trueKeys.length - 1 ? '' : ', '
                              }`
                          })
                          return `${isAllTrue
                            ? 'All'
                            : isAllFalse
                              ? 'None'
                              : `${trueKeysLabel}`
                            }`
                        },
                        verbs: [
                          {
                            label: 'Sort',
                            value: 'Sort',
                            object: (e) => selectorObject(e, filterState?.department?.object),
                          },
                        ],
                      },
                      name: {
                        label: 'Description',
                        renderFilterLabel: (st) => {
                          if (!filterState.name || !filterState.name.object) {
                            return 'All'
                          }
                          const keys = filterState.name.object ? Object.keys(filterState.name.object) : {}
                          const isAllTrue = !keys.some((key) => !filterState.name.object[key])
                          const isAllFalse = !keys.some((key) => filterState.name.object[key])
                          const trueKeys = keys.filter((key) => filterState.name.object[key])
                          let trueKeysLabel = ''
                          trueKeys.forEach((key, index) => {
                            trueKeysLabel += `${key}${index === trueKeys.length - 1 ? '' : ', '
                              }`
                          })
                          return `${isAllTrue
                            ? 'All'
                            : isAllFalse
                              ? 'None'
                              : `${trueKeysLabel}`
                            }`
                        },
                        verbs: [
                          {
                            label: 'Sort',
                            value: 'Sort',
                            object: (e) => selectorObject(e, filterState?.name?.object),
                          },
                        ],
                      },
                    },
                  }}
                />
              </section>

        </>
      )}
    </>
  )
}

export default Wishlist
